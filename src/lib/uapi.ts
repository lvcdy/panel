
let clientInstance: any = null;

export const getClient = async () => {
    if (clientInstance) return clientInstance;

    const { UapiClient } = await import('uapi-sdk-typescript');
    clientInstance = new UapiClient('https://uapis.cn');
    return clientInstance;
};
