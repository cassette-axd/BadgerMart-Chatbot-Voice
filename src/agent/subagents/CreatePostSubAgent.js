import { isLoggedIn, ofRandom } from "../Util"

const createPostSubAgent = (end) => {

    const CS571_WITAI_ACCESS_TOKEN = "DIWNRB6KS4VXVJECVRDPSMWTADIC7NNL"; // Put your CLIENT access token here.

    let stage;
    let title, content, chatroom;

    const availableChatrooms = [
        "Bascom Hill Hangout", 
        "Memorial Union Meetups", 
        "Witte Whispers", 
        "Chadbourne Chats", 
        "Red Gym Rendezvous", 
        "Babcock Banter", 
        "Humanities Hubbub"
    ];

    const handleInitialize = async (promptData) => {
        if (await isLoggedIn()) {
            console.log(promptData);
            const chatroomEntity = promptData.entities?.["chatroom:chatroom"]?.[0];
            chatroom = chatroomEntity?.body || null;
            if (chatroom === null) {
                return end(ofRandom([
                    "You must specify a chatroom when creating a post.",
                    "You need to specify a chatroom when creating a post."
                ]));
            }
            const validChatroom = availableChatrooms.find(c => c.toLowerCase().includes(chatroom.toLowerCase()));
            chatroom = validChatroom;
            console.log(validChatroom);
            stage = "FOLLOWUP_TITLE";
            return ofRandom([
                `Got it! You're posting in '${chatroom}'. What would you like the title of your post to be?`,
                `Okay, you're posting in '${chatroom}'. What's the title of your post?`
            ]);
        } else {
            return end(ofRandom([
                "You must be signed in to create a post.",
                "Please sign in before creating a post."
            ]));
        }
    };

    const handleReceive = async (prompt) => {
        switch (stage) {
            case "FOLLOWUP_TITLE":
                return await handleFollowupTitle(prompt);
            case "FOLLOWUP_CONTENT":
                return await handleFollowupContent(prompt);
            case "FOLLOWUP_CONFIRM":
                return await handleFollowupConfirm(prompt);
        }
    };

    const handleFollowupTitle = async (prompt) => {
        if (prompt.length > 128) {
            return end("Sorry, the title must be 128 characters or fewer.");
        }
        title = prompt;
        stage = "FOLLOWUP_CONTENT";
        return ofRandom([
            "Great! What's the content of your post?",
            "Thanks! What's the content of your post?"
        ]);
    };

    const handleFollowupContent = async (prompt) => {
        if (prompt.length > 1024) {
            return end("Sorry, the content must be 1024 characters or fewer.");
        }
        content = prompt;
        stage = "FOLLOWUP_CONFIRM";
        return ofRandom([
            `Got it! You’re posting in '${chatroom}' with the title '${title}' and the content: "${content}". Would you like to post this?`,
            `Alright! You’re posting in '${chatroom}' with the title '${title}' and this content: "${content}". Should I go ahead and post it?`
        ]);
    };

    const handleFollowupConfirm = async (prompt) => {
        const userResponse = prompt.toLowerCase();
        const confirmationWords = ["yes", "yup", "yeah"];
        const isConfirmed = confirmationWords.some(word => userResponse.includes(word));

        if (isConfirmed) {
            try {
                const postResp = await fetch(`https://cs571api.cs.wisc.edu/rest/f24/hw11/messages?chatroom=${encodeURIComponent(chatroom)}`, {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33",
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        title: title,
                        content: content
                    })
                });

                if (postResp.status === 200) {
                    return end(ofRandom([
                        "Your post has been successfully created!",
                        "Success! Your post is now live!"
                    ]));
                } else if (postResp.status === 404) {
                    return end("The specified chatroom does not exist. Please check the chatroom name and try again.");
                } else if (postResp.status === 401) {
                    return end("You must be logged in to create a post. Please log in and try again.");
                } else if (postResp.status === 400) {
                    return end("Your post must include both a title and content. Please try again.");
                } else {
                    console.log("Unexpected status code:", postResp.status);
                    return end("An error occurred while trying to create your post. Please try again later.");
                }
            } catch (error) {
                console.error("Post creation failed:", error);
                return end("An error occurred while trying to create your post. Please try again later.");
            }
        } else {
            return end(ofRandom([
                "No worries! Your post has not been created.",
                "Got it. If you change your mind, just let me know!"
            ]));
        }
    };

    return {
        handleInitialize,
        handleReceive
    };
};

export default createPostSubAgent;