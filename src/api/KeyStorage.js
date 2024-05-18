export const storeToken = (token, expirationDate) => {
    localStorage.setItem('token', token);
    localStorage.setItem('expirationDate', expirationDate);
};

export const getToken = () => {
    const token = localStorage.getItem('token');
    if (token == null) return null;

    const expiration = localStorage.getItem('expirationDate');
    if (expiration == null) {
        return null;
    }

    const expirationDate = Date.parse(expiration);
    if (expirationDate < Date.now()) {
        return null;
    }

    return {
        token: token,
        expirationDate: expirationDate
    };
};