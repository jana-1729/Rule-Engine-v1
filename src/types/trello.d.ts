/**
 * Type definitions for trello module
 * Custom type declarations for the Trello SDK
 */

declare module 'trello' {
  class Trello {
    constructor(apiKey: string, token: string);
    
    addCard(
      name: string,
      description: string,
      listId: string,
      due?: string,
      dueComplete?: boolean,
      pos?: string | number,
      labels?: string,
      urlSource?: string,
      members?: string
    ): Promise<any>;
    
    updateCard(cardId: string, updates: any): Promise<any>;
    
    addChecklistToCard(cardId: string, name: string): Promise<any>;
    
    addItemToChecklist(
      checklistId: string,
      name: string,
      state?: string
    ): Promise<any>;
    
    makeRequest(
      method: string,
      path: string,
      params?: any
    ): Promise<any>;
  }
  
  export = Trello;
}

