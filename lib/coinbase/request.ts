import { SignOptions, sign } from "jsonwebtoken";

const key_name = process.env.CDP_API_KEY_NAME as string;
const key_secret = process.env.CDP_API_KEY_PRIVATE_KEY as string;

if (!key_name || !key_secret) {
    throw new Error("No API key found");
}

export type CreateRequestParams = {
    request_method: "GET" | "POST";
    request_path: string;
};

function generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function createRequest({
    request_method,
    request_path,
}: CreateRequestParams) {
    const host = "api.developer.coinbase.com";

    const url = `https://${host}${request_path}`;
    const uri = `${request_method} ${host}${request_path}`;

    const payload = {
        iss: "cdp",
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 120,
        sub: key_name,
        uri,
    };

    const signOptions: SignOptions = {
        algorithm: "ES256",
        header: {
            alg: "ES256",
            kid: key_name,
            // @ts-expect-error: This is a Coinbase-specific header
            nonce: generateNonce(),
        },
    };

    const jwt = sign(payload, key_secret, signOptions);

    return { url, jwt };
}