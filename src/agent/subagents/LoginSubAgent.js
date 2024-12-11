import { isLoggedIn, ofRandom } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createLoginSubAgent = (end) => {

    let stage;
    let username, pin;

    const handleInitialize = async () => {
        if (await isLoggedIn()) {
            return end(ofRandom([
                "You are already logged in. Please log out before logging in again.",
                "It seems you are already signed in. Log out first if you'd like to sign in with a different account."
            ]));
        } else {
            stage = "FOLLOWUP_USERNAME";
            return ofRandom([
                "Sure, what is your username?",
                "Alright, what is your username?"
            ]);
        }
    };

    const handleReceive = async (prompt) => {
        switch (stage) {
            case "FOLLOWUP_USERNAME": 
                return await handleFollowupUsername(prompt);
            case "FOLLOWUP_PASSWORD": 
                return await handleFollowupPassword(prompt);
        }
    };

    const handleFollowupUsername = async (prompt) => {
        username = prompt;
        stage = "FOLLOWUP_PASSWORD";
        const msg = ofRandom([
            "Great, and what is your password?",
            "Thanks, and what is your password?"
        ]);

        return {
            msg: msg,
            nextIsSensitive: true,
            emote: undefined,
        } 
    };

    const handleFollowupPassword = async (prompt) => {
        pin = prompt;

        try {
            const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ 
                    username: username, 
                    pin: pin 
                })
            });

            if (resp.status === 200) {
                const msg = ofRandom([
                    `Successfully logged in, ${username}!`,
                    `Success! You have been logged in, ${username}.`
                ]);
    
                return end({
                    msg: msg,
                    nextIsSensitive: false,
                    emote: AIEmoteType.SUCCESS
                })
            } else {
                const msg = ofRandom([
                    "Sorry, that username and password is incorrect.",
                    "Sorry, your username or password is incorrect.",
                ]);
    
                return end({
                    msg: msg,
                    nextIsSensitive: false,
                    emote: AIEmoteType.ERROR
                })
            }    
        } catch (error) {
            console.error("Login failed: ", error);
            return end("An error occurred while trying to log in. Please try again later.");
        }
    };
    

    return {
        handleInitialize,
        handleReceive
    };
}

export default createLoginSubAgent;