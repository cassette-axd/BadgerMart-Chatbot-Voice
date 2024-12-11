const ofRandom = (arr) => {
    return arr[Math.floor(Math.random() * arr.length)];
}

const isLoggedIn = async () => {
    const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/whoami", {
        credentials: "include",
        headers: {
            "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33"
        }
    })
    const body = await resp.json();
    return body.isLoggedIn;
}

const getLoggedInUsername = async () => {
    const resp = await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/whoami", {
        credentials: "include",
        headers: {
            "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33"
        }
    })
    const body = await resp.json();
    if (body.isLoggedIn) {
        return body.user.username;
    } else {
        return undefined;
    }
}

const logout = async () => {
    await fetch("https://cs571api.cs.wisc.edu/rest/f24/hw11/logout", {
        method: "POST",
        credentials: "include",
        headers: {
            "X-CS571-ID": "bid_e7ec26af4ef707a35f841cb5b94bb44e16be845865dce36f04c32078521eed33"
        }
    })
}

export {
    ofRandom,
    isLoggedIn,
    getLoggedInUsername,
    logout
}