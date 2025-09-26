import LLM "mo:llm";
import Principal "mo:base/Principal";
import HashMap "mo:base/HashMap";
import Buffer "mo:base/Buffer";
import Array "mo:base/Array";
import Option "mo:base/Option";
import Error "mo:base/Error";

actor class ChatBot() = this {
  // Stable storage for chat history
  private stable var userChatsEntries : [(Principal, [LLM.ChatMessage])] = [];
  private var userChats = HashMap.HashMap<Principal, Buffer<LLM.ChatMessage>>(
    10,
    Principal.equal,
    Principal.hash
  );

  // Constants
  private let MAX_HISTORY_SIZE = 100;
  private let INITIAL_MESSAGE = {
    system = {
      content = "I'm a sovereign AI agent living on the Internet Computer. Ask me anything."
    }
  };

  system func preupgrade() {
    // Store chat histories before upgrade
    userChatsEntries := Array.map<(Principal, Buffer<LLM.ChatMessage>), (Principal, [LLM.ChatMessage])>(
      HashMap.toArray(userChats),
      func(entry : (Principal, Buffer<LLM.ChatMessage>)) : (Principal, [LLM.ChatMessage]) {
        (entry.0, Buffer.toArray(entry.1))
      }
    );
  };

  system func postupgrade() {
    // Restore chat histories after upgrade
    for ((principal, messages) in userChatsEntries.vals()) {
      let buffer = Buffer.Buffer<LLM.ChatMessage>(MAX_HISTORY_SIZE);
      for (msg in messages.vals()) {
        buffer.add(msg);
      };
      userChats.put(principal, buffer);
    };
    userChatsEntries := [];
  };

  // Helper to get or initialize user chat history
  private func getUserChat(user: Principal) : Buffer<LLM.ChatMessage> {
    switch (userChats.get(user)) {
      case (?chat) chat;
      case null {
        let newChat = Buffer.Buffer<LLM.ChatMessage>(MAX_HISTORY_SIZE);
        newChat.add(INITIAL_MESSAGE);
        userChats.put(user, newChat);
        newChat
      };
    };
  };

  public shared(msg) func prompt(prompt : Text) : async Text {
    await LLM.prompt(#Llama3_1_8B, prompt);
  };

  public shared(msg) func chat(messages : [LLM.ChatMessage]) : async Text {
    if (Principal.isAnonymous(msg.caller)) {
      throw Error.reject("Authentication required");
    };

    let userChat = getUserChat(msg.caller);
    
    // Add new messages to history
    for (message in messages.vals()) {
      if (userChat.size() >= MAX_HISTORY_SIZE) {
        userChat.removeLast();
      };
      userChat.add(message);
    };

    let response = await LLM.chat(#Llama3_1_8B).withMessages(messages).send();
    
    switch (response.message.content) {
      case (?text) {
        // Add response to history
        if (userChat.size() >= MAX_HISTORY_SIZE) {
          userChat.removeLast();
        };
        userChat.add({ system = { content = text } });
        text
      };
      case null "";
    };
  };

  public shared query(msg) func getChatHistory() : async ?[LLM.ChatMessage] {
    if (Principal.isAnonymous(msg.caller)) {
      return null;
    };
    
    switch (userChats.get(msg.caller)) {
      case (?chat) ?Buffer.toArray(chat);
      case null null;
    };
  };

  public shared(msg) func clearHistory() : async Bool {
    if (Principal.isAnonymous(msg.caller)) {
      return false;
    };
    
    userChats.delete(msg.caller);
    true;
  };
};
