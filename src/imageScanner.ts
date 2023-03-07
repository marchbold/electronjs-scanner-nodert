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
  ImageScannerFormat,
} from '@nodert-win10-rs4/windows.devices.scanners';
import { StorageFolder, StorageFile } from '@nodert-win10-rs4/windows.storage';
import * as path from "path";
import { promisify } from 'util';
import * as utils from './utils'

const getFolderFromPathAsync = promisify(StorageFolder.getFolderFromPathAsync);
const getFileFromPathAsync = promisify(StorageFile.getFileFromPathAsync);
const scannerFromId = promisify(ImageScanner.fromIdAsync);

const outputPath = path.join(__dirname, 'images');

let scannerWatcher: DeviceWatcher;

let scannedFiles: Array<StorageFile> = [];

const startScan = () => {
  scannerWatcher = DeviceInformation.createWatcher(DeviceClass.imageScanner);
  scannerWatcher.on(
    'added',
    async (sender: DeviceWatcher, eventArgs: DeviceAccessChangedEventArgs) => {
      console.log(`added:${eventArgs.id}`);
      try {
        const scanner: ImageScanner = await scannerFromId(eventArgs.id);
        scanner.feederConfiguration
        scanner.feederConfiguration.desiredResolution = { dpiX: 600, dpiY: 600 };
        scanner.feederConfiguration.format = ImageScannerFormat.deviceIndependentBitmap;

        await fse.ensureDir(outputPath);
        const outputFolder: StorageFolder = await getFolderFromPathAsync(outputPath);

        scannedFiles = [];

        var scanMoreFiles: boolean = true;
        const scanFilesToFolder = promisify(scanner.scanFilesToFolderAsync).bind(scanner);
        while (scanMoreFiles) {
          const scanResult: ImageScannerScanResult = await scanFilesToFolder(
            ImageScannerScanSource.feeder,
            outputFolder
          );

          for (let i = 0; i < scanResult.scannedFiles.length; i += 1) {
            const f: StorageFile = scanResult.scannedFiles.getAt(i);
            console.log("scanned: " + f.path);
            scannedFiles.push(f);
          }
          scanMoreFiles = !!scanResult.scannedFiles.length;
        }

        const croppedFiles: Array<StorageFile> = await Promise.all(
          scannedFiles.map(async (file: StorageFile) => performEdgeDetection(file))
        );

      } catch (e) {
        console.error(e);
      }
    }
  );
  scannerWatcher.start();
};


const performEdgeDetection = async (f: StorageFile): Promise<StorageFile> => {
  console.log('Perform edge detection: ' + f.path);
  const croppedFile: StorageFile = await utils.edgeDetection(f)
  console.log('Edge detection complete: ' + croppedFile.path);
  const deleteAsync = promisify(f.deleteAsync).bind(f);
  await deleteAsync();
  return croppedFile;
};


const edgeDetection = async () => {
  let f: StorageFile;
  if (scannedFiles.length == 0) {
    // probably should update this to pull an image from the outputPath
    console.log('no scanned files - trying static');
    f = await getFileFromPathAsync(outputPath + '\\SCN_20221111.bmp')
  } else {
    f = scannedFiles[scannedFiles.length - 1];
  }

  const croppedFile: StorageFile = await performEdgeDetection(f);

  console.log('Edge detection complete: ' + croppedFile.path);

};


export { startScan, edgeDetection };
