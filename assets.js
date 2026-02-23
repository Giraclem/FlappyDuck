export const GameAssets = {
  bird: null,
  background: null,
  pipebody: null,
  pipehead: null,
  SFXjumping: null,
  SFXscoring: null,
  SFXdie: null,
  
  isReady() {
    return this.bird && this.background && this.pipebody && this.pipehead;
  }
};