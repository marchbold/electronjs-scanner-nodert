
import { StorageFile } from '@nodert-win10-rs4/windows.storage';
import * as Jimp from 'jimp';
import * as path from "path";
import { promisify } from 'util';
import { format } from 'date-fns';

import * as Color from 'color';
import * as ColorDiff from 'color-difference';

const getFileFromPathAsync = promisify(StorageFile.getFileFromPathAsync);

const whiteRGB = { r: 255, g: 255, b: 255 };
const white = Color(whiteRGB).hex().toUpperCase();

const isWhite = (colour: number, threshold: number): boolean => {
  let c = Jimp.intToRGBA(colour);
  colour = Color({ r: c.r, g: c.g, b: c.b }).hex().toUpperCase();
  if (colour === white) return true;
  if (!threshold) return false;
  let compare = ColorDiff.compare(colour, white);
  if (compare <= threshold) return true;
  return false;
}

const isWhiteRow = async (image: Jimp, xMin: number, xMax: number, rowY: number): Promise<boolean> => {
  for await (const { x, y } of image.scanIterator(
    xMin, rowY, xMax - xMin, 1
  )) {
    const colour = image.getPixelColor(x, y);
    if (!isWhite(colour, 5)) {
      return false;
    }
  }
  return true;
}

const isGrey = (colour: number, threshold: number): boolean => {
  let c = Jimp.intToRGBA(colour);
  if (c.r !== 255 || c.b !== 255 || c.g !== 255)
    return (Math.abs(c.r - c.g) <= threshold) &&
      (Math.abs(c.g - c.b) <= threshold) &&
      (Math.abs(c.b - c.r) <= threshold);
  return true;
}

const isGreyRow = async (image: Jimp, xMin: number, xMax: number, rowY: number): Promise<boolean> => {
  for await (const { x, y } of image.scanIterator(
    xMin, rowY, xMax - xMin, 1
  )) {
    const colour = image.getPixelColor(x, y);
    if (!isGrey(colour, 24)) {
      return false;
    }
  }
  return true;
}

const isGreyCol = async (image: Jimp, yMin: number, yMax: number, colX: number): Promise<boolean> => {
  for await (const { x, y } of image.scanIterator(
    colX, yMin, 1, yMax - yMin
  )) {
    const colour = image.getPixelColor(x, y);
    if (!isGrey(colour, 24)) {
      return false;
    }
  }
  return true;
}

const edgeDetectionImpl = async (image: Jimp): Promise<{ left: number, top: number, width: number, height: number }> => {
  let xMin: number = 0,
    yMin: number = 0,
    xMax: number = image.bitmap.width,
    yMax: number = image.bitmap.height;

  // Remove any all white lines from top
  for (let y = yMin; y < yMax; y++) {
    if (!await isWhiteRow(image, xMin, xMax, y)) {
      yMin = y;
      break;
    }
  }
  // Remove any all grey lines from top
  for (let y = yMin; y < yMax; y++) {
    if (!await isGreyRow(image, xMin, xMax, y)) {
      yMin = y;
      break;
    }
  }

  // Find bottom by searching for all white line block
  let allWhite: boolean = true;
  let yLimit: number = 0;
  let y: number = yMin;
  while ((y < yMax) && !allWhite) {
    if (await isWhiteRow(image, xMin, xMax, y)) {
      allWhite = true;
      yLimit = y;
    }
    y++;
    if (allWhite) {
      //Are the next five rows all white?  If they are then treat this as the boundary
      while (allWhite && (y < yMax) && (y < yLimit + 5)) {
        if (!await isWhiteRow(image, xMin, xMax, y))
          allWhite = false;
        y++;
      }
      if (allWhite)
        yMax = yLimit;
    }
  }
  // Remove any all grey lines from bottom
  while (yMax > 0) {
    if (!await isGreyRow(image, xMin, xMax, yMax)) {
      break;
    }
    yMax--;
  }

  // Remove all grey columns from left
  for (let x = xMin; (x < xMax); x++) {
    if (!await isGreyCol(image, yMin, yMax, x)) {
      xMin = x;
      break;
    }
  }

  // Remove all grey columns from right
  for (let x = xMax; (x > xMin); x--) {
    if (!await isGreyCol(image, yMin, yMax, x - 1)) {
      xMax = x;
      break;
    }
  }

  const shadowCutMargin = 4;
  return {
    left: xMin + shadowCutMargin,
    top: yMin + shadowCutMargin,
    width: xMax - xMin - 2 * shadowCutMargin,
    height: yMax - yMin - 2 * shadowCutMargin,
  };

};






export const edgeDetection = async (f: StorageFile): Promise<StorageFile> => {
  console.log('edgeDetection(): ' + f.path);

  const filename = format(new Date(), 'yyyyMMdd_HHmmssSSS');
  const outputPath = path.format({
    dir: path.dirname(f.path),
    base: filename + '.jpg',
  });

  try {
    const image = await Jimp.read(f.path);
    console.log(image.getWidth() + "x" + image.getHeight());

    const { left, top, width, height } = await edgeDetectionImpl(image);
    await image.crop(
      left,
      top,
      width,
      height
    );

    console.log(image.getWidth() + "x" + image.getHeight());
    await image.writeAsync(outputPath);
    return await getFileFromPathAsync(outputPath);
  }
  catch (error) {
    console.log(error);
  }

  // // First crop remove all white space at the bottom  
  // const cropa = await image.autocrop({
  //     cropOnlyFrames: false,
  //     cropSymmetric: false,
  //     tolerance,
  //     leaveBorder,
  //     ignoreSides: {
  //         north: true,
  //         south: false,
  //         east: true,
  //         west: true,
  //     },
  // });
  // console.log(cropa.getWidth() + "x" + cropa.getHeight());

  // // Second crop semetric removes the gray from the left/right sides
  // const cropb = await cropa.autocrop({
  //     cropOnlyFrames: false,
  //     cropSymmetric: true,
  //     tolerance,
  //     leaveBorder,
  //     ignoreSides: {
  //         north: true,
  //         south: true,
  //         east: false,
  //         west: false,
  //     },
  // });
  // console.log(cropb.getWidth() + "x" + cropb.getHeight());

  // const cropAmount = 5;
  // const crop = await cropb.crop(
  //     cropAmount, 
  //     cropAmount,
  //     cropb.getWidth() - 2 * cropAmount,
  //     cropb.getHeight() - 2 * cropAmount,
  // );

  // console.log(crop.getWidth() + "x" + crop.getHeight());
  // await crop.writeAsync(outputPath);


  return await getFileFromPathAsync(outputPath);
}  