
import { StorageFile } from '@nodert-win10-rs4/windows.storage';
import * as Jimp from 'jimp';
import * as path from "path";
import { promisify } from 'util';
import { format } from 'date-fns';

const getFileFromPathAsync = promisify(StorageFile.getFileFromPathAsync);

export const edgeDetection = async (f: StorageFile): Promise<StorageFile> => {
    console.log('edgeDetection(): ' + f.path);

    const leaveBorder = 5;
    const tolerance = 0.18;

    const filename = format( new Date(), 'yyyyMMdd_HHmmssSSS' );
    const outputPath = path.format({
        dir: path.dirname(f.path),
        base: filename + '.jpg',
    });

    const image = await Jimp.read(f.path);
    console.log(image.getWidth() + "x" + image.getHeight());

    // First crop remove all white space at the bottom  
    const cropa = await image.autocrop({
        cropOnlyFrames: false,
        // cropSymmetric: true,
        tolerance,
        leaveBorder,
        ignoreSides: {
            north: true,
            south: false,
            east: true,
            west: true,
        },
    });
    console.log(cropa.getWidth() + "x" + cropa.getHeight());

    // Second crop semetric removes the gray from the left/right sides
    const crop = await cropa.autocrop({
        cropOnlyFrames: false,
        cropSymmetric: true,
        tolerance,
        leaveBorder,
        ignoreSides: {
            north: true,
            south: true,
            east: false,
            west: false,
        },
    });
    console.log(crop.getWidth() + "x" + crop.getHeight());

    await crop.writeAsync(outputPath);

    return await getFileFromPathAsync(outputPath);
}  