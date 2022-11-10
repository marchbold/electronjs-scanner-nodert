import type { ScannerAPI } from './preload'

declare global {
  interface Window {
    scanner: ScannerAPI
  }
}
