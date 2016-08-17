'use strict'

export interface ProtocolError{
    errorCode: string
    errorDescription?: string
}

export class ProtocolErrors{
    public static unauthorized: ProtocolError = {
        errorCode: 'UNAUTHORIZED', 
        errorDescription: 'The request did not have sufficient permissions to perform the request.'
    }

    public static noDevice: ProtocolError = {
        errorCode: "NO_DEVICE",
        errorDescription: 'The device specified in the URI could not be found.'
    }

    public static outOfRange: ProtocolError = {
        errorCode: "OUT_OF_RANGE",
        errorDescription: 'The sequence number was beyond the end of the buffer.'
    }

    public static tooMany: ProtocolError = {
        errorCode: "TOO_MANY",
        errorDescription: 'The count given is too large.'
    }

    public static invalidUri: ProtocolError = {
        errorCode: "INVALID_URI",
        errorDescription: 'The URI provided was incorrect.'
    }

    public static invalidRequest: ProtocolError = {
        errorCode: "INVALID_REQUEST",
        errorDescription: 'The request was not one of the three specified requests.'
    }

    public static internalError: ProtocolError = {
        errorCode: "INTERNAL_ERROR",
        errorDescription: 'The Agent did not behave correctly. Contact the software provider.'
    }

    public static invalidXPath: ProtocolError = {
        errorCode: "INVALID_XPATH",
        errorDescription: 'The XPath could not be parsed. Invalid syntax or the XPath did not match any valid elements in the document.'
    }

    public static unsupported: ProtocolError = {
        errorCode: "UNSUPPORTED",
        errorDescription: 'A valid request was provided, but the Agent does not support the feature or request type.'
    }

    public static assetNotFound: ProtocolError = {
        errorCode: "ASSET_NOT_FOUND",
        errorDescription: 'An asset ID cannot be located.'
    }

    /* Custom errors */

    public static unableToStore: ProtocolError = {
        errorCode: "UNABLE_TO_STORE",
        errorDescription: 'The agent was not able to store the given data.'
    }
}