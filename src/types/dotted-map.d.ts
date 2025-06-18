declare module 'dotted-map' {
  interface DottedMapOptions {
    height?: number;
    grid?: 'vertical' | 'diagonal' | 'horizontal';
  }

  interface GetSVGOptions {
    radius?: number;
    color?: string;
    shape?: 'circle' | 'square';
    backgroundColor?: string;
  }

  class DottedMap {
    constructor(options?: DottedMapOptions);
    getSVG(options?: GetSVGOptions): string;
  }

  export default DottedMap;
}