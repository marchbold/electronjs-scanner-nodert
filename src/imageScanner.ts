import * as fse from 'fs-extra';
import {
    DeviceWatcher,
    DeviceInformation,
    DeviceClass,
    DeviceAccessChangedEventArgs,
} from '@nodert-win10-rs4/windows.devices.enumeration';
import {
    ImageScanner,
    ImageScannerScanSource,
    ImageScannerScanResult,
} from '@nodert-win10-rs4/windows.devices.scanners';
import { StorageFolder, StorageFile } from '@nodert-win10-rs4/windows.storage';
import * as path from "path";
import { promisify } from 'util';

const getFolderFromPathAsync = promisify(StorageFolder.getFolderFromPathAsync);
const scannerFromId = promisify(ImageScanner.fromIdAsync);

const outputPath = path.join(__dirname, 'images');

let scannerWatcher: DeviceWatcher;

let scannedFiles:Array<StorageFile> = [];

const startScan = () => {
    scannerWatcher = DeviceInformation.createWatcher(DeviceClass.imageScanner);
    scannerWatcher.on(
      'added',
      async (sender: DeviceWatcher, eventArgs: DeviceAccessChangedEventArgs) => {
        console.log(`added:${eventArgs.id}`);
        try {
          const scanner: ImageScanner = await scannerFromId(eventArgs.id);
          scanner.feederConfiguration.desiredResolution = { dpiX: 600, dpiY: 600 };

          await fse.ensureDir(outputPath);
          const outputFolder: StorageFolder = await getFolderFromPathAsync(outputPath);
          const scanFilesToFolder = promisify(scanner.scanFilesToFolderAsync).bind(scanner);
          const scanResult: ImageScannerScanResult = await scanFilesToFolder(
            ImageScannerScanSource.feeder,
            outputFolder
          );
  
          scannedFiles = [];
          for (let i = 0; i < scanResult.scannedFiles.length; i += 1) {
            const f:StorageFile = scanResult.scannedFiles.getAt(i);
            console.log( "scanned: " + f.path );
            scannedFiles.push(f);
          }

        } catch (e) {
          console.error(e);
        }
      }
    );
    scannerWatcher.start();
};

const edgeDetection = () => {
    console.log( 'todo' );
};


export { startScan, edgeDetection };
