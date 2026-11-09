// CodexaStudio client space: announcement banner, cookieless stats and the
// contact form inbox. The site key is public by design (it ships in the page
// HTML) and Codexa only accepts requests coming from the production origin.

export const CODEXA_SITE_KEY = "site_YWJ_UfCHZI43_cmWM6mpfNhB";

export const CODEXA_EMBED_SRC = "https://app.codexastudio.fr/embed.js";

export const CODEXA_FORM_URL = `https://app.codexastudio.fr/api/forms/${CODEXA_SITE_KEY}`;

// Where the no-JavaScript form submission lands once Codexa has the message.
export const CONTACT_THANK_YOU_URL = "https://burgerbynight72.fly.dev/merci";
