import LLM "mo:llm";
import Array "mo:base/Array";
import Principal "mo:base/Principal";
import Trie "mo:base/Trie";

persistent actor {
  stable var histories : Trie.Trie<Principal, [LLM.ChatMessage]> = Trie.empty();

  let anonymousPrincipal = Principal.fromText("2vxsx-fae");

  let initialSystemMessage : LLM.ChatMessage = #system({
    content = "I'm a sovereign AI agent living on the Internet Computer. Ask me anything."
  });

  func shouldPersist(p : Principal) : Bool {
    not Principal.equal(p, anonymousPrincipal);
  };

  func key(p : Principal) : Trie.Key<Principal> {
    { key = p; hash = Principal.hash(p) };
  };

  func getHistory(p : Principal) : [LLM.ChatMessage] {
    if (shouldPersist(p)) {
      switch (Trie.find(histories, key(p), Principal.equal)) {
        case (?history) history;
        case null [initialSystemMessage];
      };
    } else {
      [initialSystemMessage];
    };
  };

  public func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt)
  };

  public query shared ({ caller }) func getChatHistory() : async [LLM.ChatMessage] {
    getHistory(caller);
  };

  public shared ({ caller }) func chat(messages : [LLM.ChatMessage]) : async [LLM.ChatMessage] {
    let baseHistory = getHistory(caller);
    let normalizedHistory =
      if (Array.size(messages) == 0) {
        baseHistory;
      } else {
        Array.append([initialSystemMessage], messages);
      };

    let response = await LLM.chat(#Llama3_1_8B)
      .withMessages(normalizedHistory)
      .send();

    let replyText = switch (response.message.content) {
      case (?text) text;
      case null "";
    };

    let assistantMessage : LLM.ChatMessage = #assistant({ content = replyText });

    let updatedHistory = Array.append(normalizedHistory, [assistantMessage]);

    if (shouldPersist(caller)) {
      histories := Trie.put(histories, key(caller), Principal.equal, updatedHistory).0;
    };

    updatedHistory;
  };

  public shared ({ caller }) func clearHistory() : async Bool {
    if (!shouldPersist(caller)) {
      return false;
    };

    histories := Trie.remove(histories, key(caller), Principal.equal).0;
    true;
  };
};
