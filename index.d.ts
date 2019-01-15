// import * as I18n from 'i18n';

declare module 'hapi' {
  export interface Request {
    /**
     * Assign the types based on the mashpie @types/i18n
     */
    i18n: i18nAPI;
  }
}
