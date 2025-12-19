export const GameAssets = {
  bird: null,
  background: null,
  pipebody: null,
  pipehead: null,
  
  isReady() {
    return this.bird && this.background && this.pipe;
  }
};