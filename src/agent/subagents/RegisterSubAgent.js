import { isLoggedIn, ofRandom } from "../Util"
import AIEmoteType from '../../components/chat/messages/AIEmoteType';

const createRegisterSubAgent = (end) => {

    let stage;
    let username, pin, confirmPin;

    const handleInitialize = async () => {
        if (await isLoggedIn()) {
            return end(ofRandom([
                "You are already logged in. Please log out before registering.",
                "It seems you are already signed in. Log out first if you'd like to register a new account."
            ]));
        } else {
            stage = "FOLLOWUP_USERNAME";
            return ofRandom([
                "Sure, what do you want your username to be?",
                "Alright, what should your username be?"
            ]);
        }
    };

    const handleReceive = async (prompt) => {
        switch (stage) {
            case "FOLLOWUP_USERNAME":
                return await handleFollowupUsername(prompt);
            case "FOLLOWUP_PASSWORD":
                return await handleFollowupPassword(prompt);
            case "CONFIRM_PASSWORD":
                return await handleConfirmPassword(prompt);
        }
    };

    const handleFollowupUsername = async (prompt) => {
        if (prompt.length > 64) {
            return end("Sorry, your username must be 64 characters or fewer.");
        }
        username = prompt;
        stage = "FOLLOWUP_PASSWORD";
        const msg = ofRandom([
            "Great, please set up your 7-digit pin",
            "Thanks, and what is your 7-digit pin?"
        ]);

        return {
            msg: msg,
            nextIsSensitive: true,
            emote: undefined,
        } 
    };

    const handleFollowupPassword = async (prompt) => {
        if (!/^\d{7}$/.test(prompt)) {
            return end("Sorry, your PIN must be exactly 7 digits.");
        }

        pin = prompt;
        
        const msg = ofRandom([
            "Great, please confirm your 7-digit pin",
            "Thanks, please confirm your 7-digit pin"
        ]);

        stage = "CONFIRM_PASSWORD";

        return {
            msg: msg,
            nextIsSensitive: true,
            emote: undefined,
        } 
    };

    const handleConfirmPassword = async (prompt) => {
        if (prompt !== pin) {
            return end("Sorry, the PINs do not match. Registration has been cancelled.");
        }
        confirmPin = prompt;

        try {
            const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/register", {
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
                    `You have successfully registered and logged in, ${username}!`,
                    `Success! Your account has been created and you are now logged in, ${username}`
                ]);
    
                return end({
                    msg: msg,
                    nextIsSensitive: false,
                    emote: AIEmoteType.SUCCESS
                })
                // return end(ofRandom([
                //     "You have successfully registered and logged in!",
                //     "Success! Your account has been created and you are now logged in."
                // ]));
            } else if (resp.status === 409) {
                return end({
                    msg: "Sorry, the username is already taken. Please try again with a different username.",
                    nextIsSensitive: false,
                    emote: AIEmoteType.ERROR
                });
            } else if (resp.status === 400) {
                return end({
                    msg: "Sorry, a request must contain both a username and a valid PIN.",
                    nextIsSensitive: false,
                    emote: AIEmoteType.ERROR
                });
            } else {
                console.log("Unexpected status code:", resp.status);
                const msg = "An error occurred while trying to register. Please try again later.";
    
                return end({
                    msg: msg,
                    nextIsSensitive: false,
                    emote: AIEmoteType.ERROR
                })
                // return end("An error occurred while trying to register. Please try again later.");
            }
        } catch (error) {
            console.error("Registration failed:", error);
            return end("An error occurred while trying to register. Please try again later.");
        }
    };

    return {
        handleInitialize,
        handleReceive
    };
};

export default createRegisterSubAgent;