declare module "express-useragent" {
  export interface UserAgentDetails {
    isMobile: boolean;
    isDesktop: boolean;
    isBot: boolean;
    isTablet: boolean;
    isiPad: boolean;
    isiPod: boolean;
    isiPhone: boolean;
    isAndroid: boolean;
    isBlackberry: boolean;
    isOpera: boolean;
    isIE: boolean;
    isEdge: boolean;
    isIECompatibilityMode: boolean;
    isSafari: boolean;
    isFirefox: boolean;
    isWebkit: boolean;
    isChrome: boolean;
    isKonqueror: boolean;
    isOmniWeb: boolean;
    isSeaMonkey: boolean;
    isFlock: boolean;
    isAmaya: boolean;
    isPhantomJS: boolean;
    isEpiphany: boolean;
    source: string;
    os: string;
    platform: string;
    browser: string;
    version: string;
    isWinJs: boolean;
    isWindows: boolean;
    isLinux: boolean;
    isMac: boolean;
    isChromeOS: boolean;
    isBada: boolean;
    isSamsung: boolean;
    isRaspberry: boolean;
    isESmart: boolean;
    isAndroidTablet: boolean;
    isWinPhone: boolean;
    isSmartTV: boolean;
    isYandex: boolean;
  }

  export function parse(userAgent: string): UserAgentDetails;

  export function express(): (req: any, res: any, next: any) => void;
}
