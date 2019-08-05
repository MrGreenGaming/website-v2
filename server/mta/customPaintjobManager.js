const fse = require('fs-extra')
const md5File = require('md5-file/promise')
const customPaintjobPath = '././clientUploads/customPaintjobs/'
const fileExt = '.bmp'
class customPaintjobManager {
  static async paintjobExists(name) {
    let exists = false
    await fse.pathExists(customPaintjobPath + name + fileExt).then((e) => { exists = e }).catch((err) => {
      console.error(err)
      exists = false
    })
    return exists
  }

  static savePaintjob(file, name) {
    const base64Image = file.split(';base64,').pop()
    fse.writeFile(customPaintjobPath + name + fileExt, base64Image, { encoding: 'base64' })
  }

  static async getPaintjobMD5(filenameArr) {
    if (typeof filenameArr !== 'object') {
      throw (Error('Invalid argument (not an object)'))
    }
    const returnObj = {}
    for (const filename of filenameArr) {
      if (typeof filename !== 'string') {
        console.error('Invalid string ', filename)
      } else {
        const exists = await fse.pathExists(customPaintjobPath + filename + fileExt).catch(err => console.log(err))
        if (exists) {
          const hash = await md5File(customPaintjobPath + filename + fileExt).catch(err => console.log(err)).catch(() => {
            returnObj[filename] = false
          })
          returnObj[filename] = hash || false
        } else {
          returnObj[filename] = false
        }
      }
    }
    return returnObj
  }
}

module.exports = customPaintjobManager
