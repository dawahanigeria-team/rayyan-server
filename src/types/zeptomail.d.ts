declare module 'zeptomail' {
  export interface EmailAddress {
    address: string;
    name?: string;
  }

  export interface EmailRecipient {
    email_address: EmailAddress;
  }

  export interface SendMailOptions {
    from: EmailAddress;
    to: EmailRecipient[];
    subject: string;
    htmlbody?: string;
    textbody?: string;
    reply_to?: EmailAddress[];
    cc?: EmailRecipient[];
    bcc?: EmailRecipient[];
    track_clicks?: boolean;
    track_opens?: boolean;
    client_reference?: string;
    mime_headers?: Record<string, string>;
    attachments?: Array<{
      content?: string;
      mime_type?: string;
      name?: string;
      file_cache_key?: string;
    }>;
    inline_images?: Array<{
      mime_type?: string;
      content?: string;
      cid?: string;
      file_cache_key?: string;
    }>;
  }

  export interface SendMailResponse {
    data?: Array<{
      message_id?: string;
      code?: string;
      message?: string;
    }>;
    error?: {
      code?: string;
      message?: string;
      details?: any[];
    };
  }

  export class SendMailClient {
    constructor(config: { url: string; token: string });
    sendMail(options: SendMailOptions): Promise<SendMailResponse>;
  }
}