/*
    Contains have common functions
*/

const createCookie = ({path, httpOnly, sameSite, expires, data}) => {
    let date = new Date();
    date.setSeconds(date.getSeconds() + 900);
    const cookieOptions = {
        path: path ?? "/",
        httpOnly: httpOnly ?? true,
        secure: true,
        sameSite: sameSite ?? "none",
        expires: expires ?? date,
    };
    const cookie = `${data}; ${Object.entries(cookieOptions)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ')}`;

    return cookie;
};

module.exports = {
    createCookie
}