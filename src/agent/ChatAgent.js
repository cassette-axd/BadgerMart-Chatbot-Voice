import createChatDelegator from "./ChatDelegator";
import { isLoggedIn, logout, ofRandom } from "./Util";

const createChatAgent = () => {
    const CS571_WITAI_ACCESS_TOKEN = "DIWNRB6KS4VXVJECVRDPSMWTADIC7NNL"; // Put your CLIENT access token here.

    const delegator = createChatDelegator();

    let chatrooms = [];

    const handleInitialize = async () => {
        const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/chatrooms", {
            headers: {
                "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33"
            }
        });
        const data = await resp.json();
        chatrooms = data;

        return "Welcome to BadgerChat! My name is Bucki, how can I help you?";
    }

    const handleReceive = async (prompt) => {
        if (delegator.hasDelegate()) { return delegator.handleDelegation(prompt); }
        const resp = await fetch(`https://api.wit.ai/message?q=${encodeURIComponent(prompt)}`, {
            headers: {
                "Authorization": `Bearer ${CS571_WITAI_ACCESS_TOKEN}`
            }
        })
        const data = await resp.json();
        if (data.intents.length > 0) {
            switch (data.intents[0].name) {
                case "get_help": return handleGetHelp();
                case "get_chatrooms": return handleGetChatrooms();
                case "get_messages": return handleGetMessages(data);
                case "login": return handleLogin(data);
                case "register": return handleRegister(data);
                case "create_message": return handleCreateMessage(data);
                case "logout": return handleLogout();
                case "whoami": return handleWhoAmI(data);
            }
        }
        return "Sorry, I didn't get that. Type 'help' to see what you can do!";
    }

    const handleGetHelp = async () => {
        return ofRandom([
            "Try asking 'give me a list of chatrooms', or ask for more help!",
            "Try asking 'register for an account', or ask for more help!",
            "Try asking 'tell me the top 3 latest messages' or ask for more help!"
        ])
    }

    const handleGetChatrooms = async () => {
        console.log(chatrooms);
        return `Of course, there are 7 chatrooms: ${chatrooms.join(", ")}`;
    }

    const handleGetMessages = async (data) => {
        const availableChatrooms = [
            "Bascom Hill Hangout", 
            "Memorial Union Meetups", 
            "Witte Whispers", 
            "Chadbourne Chats", 
            "Red Gym Rendezvous", 
            "Babcock Banter", 
            "Humanities Hubbub"
        ]

        let validChatroom;

        console.log(data)

        const hasSpecifiedNumber = data.entities["wit$number:number"] ? true : false;
        console.log(hasSpecifiedNumber)

        const numMessages = hasSpecifiedNumber ? data.entities["wit$number:number"][0].value : 1;
        console.log(numMessages)

        const chatroom = data.entities["chatroom:chatroom"] 
            ? data.entities["chatroom:chatroom"][0].value 
            : null;
        console.log(chatroom);

        let endpoint;
        if (chatroom !== null) {
            validChatroom = availableChatrooms.find(c => c.toLowerCase().includes(chatroom.toLowerCase()));
            endpoint = `https://cs571api.cs.wisc.edu/rest/f24/hw11/messages?chatroom=${encodeURIComponent(validChatroom)}&num=${numMessages}`;

            if (!validChatroom) {
                console.log(`Invalid chatroom specified: ${chatroom}`);
                return `The specified chatroom '${chatroom}' is not valid.`;
            }
        } else {
            endpoint = `https://cs571api.cs.wisc.edu/rest/f24/hw11/messages?num=${numMessages}`;
        }
            // ? `https://cs571api.cs.wisc.edu/rest/f24/hw11/messages?chatroom=${encodeURIComponent(validChatroom)}&num=${numMessages}`
            // : `https://cs571api.cs.wisc.edu/rest/f24/hw11/messages?num=${numMessages}`;

        try {
            const resp = await fetch(endpoint, {
                headers: {
                    "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33"
                }
            });

            if (!resp.ok) {
                const errorResponse = await resp.json();
                if (resp.status === 400) {
                    return `Error: ${errorResponse.msg}`; 
                } else if (resp.status === 404) {
                    return `Error: ${errorResponse.msg}`; 
                } else {
                    return `Unexpected error: ${resp.status} - ${errorResponse.msg}`;
                }
            }

            const json = await resp.json();
            const messages = json.messages || [];

            if (!Array.isArray(messages)) {
                return "Unexpected response format from the server.";
            }

            if (messages.length === 0) {
                return chatroom 
                    ? `It seems there are no messages in the chatroom '${chatroom}'.`
                    : "It seems there are no recent messages to display.";
            }

            return messages
                .map(c => `${c.poster} posted in '${c.chatroom}':\nTitle: ${c.title}\nContent: ${c.content}\n---`);

        } catch (error) {
            console.error(error);
            return "An error occurred while fetching messages. Please try again later.";
        }
    }

    const handleLogin = async (promptData) => {
        return await delegator.beginDelegation("LOGIN", promptData);
    }

    const handleRegister = async (promptData) => {
        return await delegator.beginDelegation("REGISTER", promptData);
    }

    const handleCreateMessage = async (promptData) => {
        return await delegator.beginDelegation("CREATE", promptData);
    }

    const handleLogout = async () => {
        if (await isLoggedIn()) {
            await logout();
            return ofRandom([
                "You have been signed out, goodbye!",
                "You have been logged out."
            ])
        } else {
            return ofRandom([
                "You are not currently logged in!",
                "You aren't logged in."
            ])
        }
    }

    const handleWhoAmI = async (promptData) => {
        console.log(promptData)
        if (await isLoggedIn()) {
            try {
                const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/whoami", {
                    method: "GET",
                    credentials: "include",
                    headers: {
                        "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33"
                    }
                })
                const body = await resp.json();
                const username = body.user.username;
                return `You are currently loggein in as ${username}`;
            } catch (error) {
                console.error("Failed to retrieve username: ", error);
            return end("An error occurred while trying to retreive username. Please try again later.");
            }
        } else {
            return ofRandom([
                "You're currently not logged in. Try logging in or signing up.",
                "No user is currently logged in. Try logging in or signing up."
            ]);
        }
    }

    return {
        handleInitialize,
        handleReceive
    }
}

export default createChatAgent;