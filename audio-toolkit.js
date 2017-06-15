'use strict'

var fs = require('fs')
const exec = require('child_process').exec
const mv = requre('mv') // not using yet
const tempy = require('tempy')
const fs = require('fs-extra')
const globby = require('globby')

class AudioToolkit {
  constructor() {
    // in case we need some instantiated object data
  }

  // resolves to an array of converted files
  convertFormat = function(srcFiles, destFormat) {
    if (!srcFile||!destFormat)
     throw "ConvertFormat warning: srcFile & destFormat are required fields"
    // TODO, check that all extensions in srcFiles match
    if (!destFormat) destFormat = 'flac' // default format
    const tmpSrcDir = tempy.directory()
    const tmpDestDir = tempy.directory()
    // copy files to tmp directory, process entire folder, resolve array of converted files
    return Promise.All(srcFiles.map((src) => fs.copy(src, destDir))).then(
    //return copyFilesArray(srcFiles, tmpSrcDir).then(
      processAudio(tmpSrcDir, 'convertFormat', destFormat, tmpDestDir).then(
        globby(tmpDestDir+'*.'+destFormat).then((paths) => paths);
      )
    )
  }

  // joins files, resolves to destFile
  mergeFiles = function(srcFiles, destFile) {
    if (!srcFile||!destFile)
     throw "MergeFiles warning: srcFile & destFile are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile)) // if no dest specified
    const tmpSrcDir = tempy.directory()
    const tmpDestDir = tempy.directory()
    const tmpDestFile = tmpDestDir + 'destAudio.' + path.extname(srcFile)
    return Promise.All(srcFiles.map((src) => fs.copy(src, destDir))).then(
      //    return copyFilesArray(srcFiles, tmpSrcDir).then(
      processAudio(tmpSrcDir, 'mergeFiles', tmpDestDir, fileName(tmpDestFile)).then(
        fs.copy(tmpDestFile, destFile).then(
          () => destFile
        )
      )
    )
  }

  // insert one file into another, resolves to destFile
  insertFragment = function(srcFile, fragmentFile, position, destFile) {
    if (!srcFile||!fragmentFile||!position)
     throw "InsertFragment warning: srcFile, fragmentFile and position are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile))
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpFrag = tmpDir + 'fragAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(fs.copy(fragementFile, tmpFrag).then(
      processAudio(tmpDir, 'insertFragment', fileName(tmpSrc), fileName(tmpFrag), fileName(tmpDest), position).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    ))
  }

  // deletes section, resolves to destFile
  deleteSection = function(srcFile, fromPos, toPos, destFile) {
    if (!srcFile||!fromPos||!toPos)
     throw "DeleteSection warning: srcFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile))
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      processAudio(tmpDir, 'deleteSection', fileName(tmpSrc), fileName(tmpDest), fromPos, toPos).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    )
  }

  // deletes section, resolves to destFile
  replaceSection = function(srcFile, fragmentFile, fromPos, toPos, destFile) {
    if (!srcFile||!fragmentFile||!fromPos||!toPos)
     throw "ReplaceSection warning: srcFile, fragmentFile, fromPos and toPos are required fields"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile))
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpFrag = tmpDir + 'fragAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(fs.copy(fragementFile, tmpFrag).then(
      processAudio(tmpDir, 'replaceSection', fileName(tmpSrc), fileName(tmpDest), fromPos, toPos).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    ))
  }

  // splits audio and resolves to array of two dest files
  splitFile = function(srcFile, position, destPart1, destPart2) {
    if (!srcFile||!position||!toPos)
     throw "SplitFile warning: srcFile & position are required fields"
    if (!destPart1) destPart1 = tempy.file({extension: path.extname(srcFile))
    if (!destPart2) destPart2 = tempy.file({extension: path.extname(srcFile))
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest1 = tmpDir + 'destAudio1.'+ path.extname(srcFile)
    const tmpDest2 = tmpDir + 'destAudio2.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      processAudio(tmpDir, 'splitFile', fileName(tmpSrc), fileName(tmpDest1),  fileName(tmpDest1), position).done(
        // copy output file to destFile and resolve to array of 2 destFiles
        fs.copy(tmpDest1, destPart1).then(fs.copy(tmpDest2, destPart2).done(
          () => [destPart1, destPart2]
        ))
      )
    )
  }

  // returns obj with file size, audio length, format, bitrate etc.
  getMetaData = function(srcFile) {
    if (!srcFile)
     throw "GetMetaData warning: srcFile is a required field"
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      processAudio(tmpDir, 'getMetaData', fileName(tmpSrc)).done(
        (metaData) => metaData
      )
    )
  }

  // normalize volume levels
  normalizeLevels = function(srcFile, destfile, options) {
    // TODO: implement some options
    if (!srcFile)
     throw "NormalizeLevels warning: srcFile is a required field"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile))
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(fs.copy(destfile, tmpDest).then(
      processAudio(tmpDir, 'normalizeLevels', fileName(tmpSrc), fileName(tmpDest)).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    ))
  }

  // reduced excess silence between words and at either end of audio file
  normalizeSilence = function(srcFile, destfile) {
    if (!srcFile) throw "NormalizeSilence warning: srcFile is a required field"
    if (!destFile) destFile = tempy.file({extension: path.extname(srcFile))
    const tmpDir = tempy.directory()
    const tmpSrc = tmpDir + 'sourceAudio.'+ path.extname(srcFile)
    const tmpDest = tmpDir + 'destAudio.'+ path.extname(srcFile)
    return fs.copy(srcFile, tmpSrc).then(
      processAudio(tmpDir, 'normalizeSilence', fileName(tmpSrc), fileName(tmpDest)).done(
        // copy output file to destFile and resolve to destFile
        fs.copy(tmpDest, destFile).then( () => destFile )
      )
    )
  }



}

module.exports = AudioToolkit


/*
   Internal, not exported
*/

function changeExt(fp, ext) {
  let parts = fp.split('.')
  parts[parts.length-1] = ext
  return parts.join('.')
}
function fileName(fp, ext) {
  let fn = path.basename(fp)
  if (ext) fn = changeExt(fp, ext)
  return fn
}

function processAudio(folderPath, taskName, ...args){
  return new Promise(function(resolve, reject) {
    prepEnvironment().then( () => {
      let args = join(' ', args)
      let cmd = `'docker' run --rm -d -v ${folderPath}:/data /app/${taskName}.sh ${args}`
      console.log('Exec: '+ cmd)
      let docker = exec(cmd)
      docker.stdout.on('close', code =>  resolve($(code)) )
      docker.stdout.on('exit', code =>  resolve($(exit)) )
      docker.stdout.on('error', err => reject(err) )
    }
  }
}

prepEnvironment = function() {
  return new Promise(function(resolve, reject) {
    let docker = exec('"eval $(docker-machine env default)"')
    docker.stdout.on('close', code => resolve($(code)) )
    docker.stdout.on('exit', code =>  resolve($(exit)) )
    docker.stdout.on('error', err => reject(err) )
  }
}








/*


module.exports.deleteAudio = function(inputFile, fromPos, toPos, outputFile) {
  let inputFileName = inputFile.split('/').pop();
  createTempFolder(inputFile)
  .then((folderPath) => {
    processAudio(folderPath, 'deleteAudio', inputFileName, fromPos, toPos)
    .then((output) => {
      // Copy the temporary output file to outputFile location

      // Remove the temporary folder

    })
    .catch((err) => {
      reject(err);
    })
  })
  .catch((err) => {
    reject(err)
  })
}

module.exports.replaceAudio = function(inputFile, segmentFile, fromPos, toPos, outputFile) {
  let inputFileName = inputFile.split('/').pop();
  let segmentFileName = segmentFile.split('/').pop();
  createTempFolder(inputFile, segmentFile)
  .then((folderPath) => {
    processAudio(folderPath, 'replaceAudio', inputFileName, segmentFileName, fromPos, toPos)
    .then((output) => {
      // Copy the temporary output file to outputFile location

      // Remove the temporary folder

    })
    .catch((err) => {
      reject(err);
    })
  })
}

module.exports.extractFile = function(inputFile, fromPos, toPos, outputFile) {

}

module.exports.splitFile = function(inputFile, atPos, outputFile1, outputFile2) {
  let inputFileName = inputFile.split('/').pop();
  createTempFolder(inputFile)
  .then((folderPath) => {
    processAudio(folderPath, 'splitFile', inputFileName, atPos)
    .then((output) => {
      // Copy the temporary output files to outputFile1 and outputFile2

      // Remove the temporary folder

    })
    .catch((err) => {
      reject(err);
    })
  })
}

module.exports.joinFiles = function(outputFile, ...inputFiles) {
  let extension = inputFiles[0].split('.').pop();
  // Throw an error if the inputFiles are not all the same extension


  createTempFolder(inputFiles...)
  .then((folderPath) => {
    return processAudio(folderPath, 'combineAllFiles', extension)
  })
  .catch((err) => {
    reject(err);
  })
}

prepEnvironment = function(){
  return new Promise(function(resolve, reject) {
    let docker = exec('"eval $(docker-machine env default)"')
    docker.stdout.on('close', code => {
      resolve($(code))
    })
    docker.stdout.on('exit', code => {
      resolve($(exit))
    })
    docker.stdout.on('error', err => {
      reject(err)
    })
  }
}

function processAudio(folderPath, taskName, ...args){
  return new Promise(function(resolve, reject) {
    fs.ensureDir(folderPath, function(err){
      if(err) reject(err)
      else {
        let prep = prepEnvironment()
        prep.then(function(result){
          let docker = exec("'docker' run --rm -d -v " + folderPath + ":/data /app/" + taskName + ".sh " + join(' ', args))
          docker.stdout.on('close', code => {
            resolve($(code))
          })
          docker.stdout.on('exit', code => {
            resolve($(exit))
          })
          docker.stdout.on('error', err =>{
            reject(err)
          })
        },
        function(err) {
          reject(err)
        })
      }
    }
  }
}

function createTempFolder(...files) {
  return new Promise(function(resolve, reject){
    // create a new temporary folder

    // copy all ...files into temporary folder

    // ensure that the files were properly copied to the folder

    // resolve with name of the temporary folder

  })
}

*/
