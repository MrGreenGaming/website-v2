const fs = require('fs')
const util = require('util')
const fse = require('fs-extra')
const xml2js = require('xml2js')
const MTA = require('mtasa').Client
const delay = require('delay')
const AdmZip = require('adm-zip')
const SftpClient = require('ssh2-sftp-client')

const validGameModePrefixes = ['nts', 'race', 'dl', 'rtf', 'dd', 'ctf', 'sh']
const allowedFileTypes = [ // All other files within the zip file will throw an error
  'xml',
  'lua',
  'map',
  'txd',
  'dff',
  'col',
  'jpg',
  'dds',
  'png',
  'bmp',
  'gif',
  'html',
  'css',
  'fx',
  'mp3',
  'wav',
  'wma',
  'ghost'
]

const areServerFilesAllowed = true // Disallow server lua files
let gameServerInfo = {
  // Race: {
  //   host: '',
  //   port: ,
  //   folder: ''
  // },
  // RaceMix: {
  //   host: '',
  //   port: ,
  //   folder: ''
  // }
}

class mapUploads {
  static async init() {
    // Empty temporary map uploads folder on startup
    await fse.emptyDir('clientUploads/mapUploads').catch((err) => {
      console.error('mapUploads empty error: ', err)
    })
  }

  static getUpdatedConfig() {
    gameServerInfo = {
      Race: {
        host: global.Config.mapupload.Race.host,
        port: global.Config.mapupload.Race.port,
        ssh: {
          user: global.Config.mapupload.Race.ssh.user,
          privateKey: fse.readFileSync(`././config/keys/${global.Config.mapupload.Race.ssh.keyFileName}`),
          host: global.Config.mapupload.Race.ssh.host,
          port: global.Config.mapupload.Race.ssh.port
        }
      },
      RaceMix: {
        host: global.Config.mapupload.RaceMix.host,
        port: global.Config.mapupload.RaceMix.port,
        ssh: {
          user: global.Config.mapupload.RaceMix.ssh.user,
          privateKey: fse.readFileSync(`././config/keys/${global.Config.mapupload.RaceMix.ssh.keyFileName}`),
          host: global.Config.mapupload.RaceMix.ssh.host,
          port: global.Config.mapupload.RaceMix.ssh.port
        }
      }
    }
    return true
  }

  static async handleMapUpload(theFile, theName, uploadUserName, uploadUserForumId, comment) {
    // Get updated info
    mapUploads.getUpdatedConfig()
    // Check zip
    const mapInfo = await this.checkZip(theFile.path, theName).catch((err) => {
      // console.log(err);
      throw Error(err.message)
    })
    // Check gamemode
    await this.checkMapGamemode(mapInfo.mode, mapInfo.map).catch((err) => {
      throw Error(err.message)
    })
    // Upload map
    const fileStripExtension = theFile.filename.replace('.zip', '')
    const extractionPath = theFile.destination + fileStripExtension
    await this.uploadMap(
      theFile,
      theFile.path,
      theName,
      mapInfo.mode,
      extractionPath,
      uploadUserName,
      uploadUserForumId,
      comment
    ).catch((err) => {
      throw Error(err.message)
    })
    return true
  }

  static async uploadMap(file, path, originalName, mode, unpackDest, uploadUserName, uploadUserForumId, comment) {
    // Check what server we need to upload to
    let serverInfo
    if (mode === 'race') {
      serverInfo = gameServerInfo.Race
    } else {
      serverInfo = gameServerInfo.RaceMix
    }

    // Map path
    const absolutePath = `/home/${serverInfo.ssh.user}/repo/resources/[maps]/[uploadedmaps]/`
    const nameNoExtension = originalName.replace('.zip', '')
    const zipPath = absolutePath + 'zips/'
    const folderPath =
    absolutePath + nameNoExtension + '_newupload'

    // Check if FTP has connection
    const sftp = new SftpClient()
    await sftp.connect(serverInfo.ssh)

    const removeUploadedFiles = async () => {
      const zipExists = await sftp.exists(zipPath + originalName)
      if (zipExists) {
        await sftp.delete(zipPath + originalName, true).catch((err) => {
          console.log(err)
        })
      }

      await sftp.rmdir(folderPath, true).catch((err) => {
        console.log(err)
      })
      await sftp.end()
    }

    try {
      await sftp.mkdir(zipPath, true)
    } catch (err) {
      console.error(err)
      throw new
      Error(
        `An error has occured while handling FTP. (${err.message})`
      )
    }
    let extractionErr
    await mapUploads.unpackZip(path, unpackDest).catch((err) => {
      console.log(err)
      extractionErr = err
    })
    if (extractionErr) {
      throw new Error(`A problem has occured while unpacking zip file: ${extractionErr.message}`)
    }
    // Upload unpacked zip folder to ftp
    // Upload zip to zip folder
    try {
      await sftp.uploadDir(unpackDest, folderPath)
      const zipReadStream = fs.createReadStream(path)
      await sftp.put(zipReadStream, zipPath + originalName)
      await sftp.end()
    } catch (err) {
      console.error(err)
      await removeUploadedFiles()
      throw new
      Error(
        `A problem has occured while uploading unpacked zip file to ftp. (${err.message})`
      )
    }

    // Notify mta server that new map is uploaded
    const serverConnection = new MTA(serverInfo.host, serverInfo.port, '', '')
    // const serverConnection = new MTA('5.2.65.7', serverInfo.port, '', '') // Dev server

    let returnedMtaValue
    try {
      serverConnection.call('maptools', 'informNewMap')
      await delay(2000) // Wait for MTA server to refresh it's resources
      returnedMtaValue = await serverConnection.call('maptools', 'newMap', nameNoExtension, uploadUserForumId, uploadUserName, comment)
      if (typeof returnedMtaValue === 'string' && returnedMtaValue.indexOf('MTA: Could not load ') === 0) {
        // Retry x times
        for (let i = 0; i < 5; i++) {
          await delay(2000) // Wait for MTA server to refresh it's resources
          returnedMtaValue = await serverConnection.call('maptools', 'newMap', nameNoExtension, uploadUserForumId, uploadUserName, comment)
          // Check if 'could not load', if not then break
          if (typeof returnedMtaValue === 'string' && returnedMtaValue.indexOf('MTA: Could not load ') === 0) {
            console.log('mapupload retry: ' + i + 1)
          } else {
            break
          }
        }
      }
    } catch (err) {
      await removeUploadedFiles()
      throw new
      Error(`Could not connect to MTA. (${err.message || ''})`)
    }
    // When maptools resource is not running, the mta sdk will return 'e'. Why not an error? No idea.
    // When successfull, will return object [true, 'New' or 'Update']
    let isUpdate
    if (typeof returnedMtaValue === 'object' && returnedMtaValue[0] === true) {
      // Success!
      isUpdate = returnedMtaValue[1]
    } else {
      // Fail, lest find out why
      await removeUploadedFiles()
      if (returnedMtaValue === 'e') {
        throw new Error('Resource "maptools" on MTA server is not running, please inform a server admin.')
      } else if (typeof returnedMtaValue === 'string') {
        throw new Error('MTA Server error: ' + returnedMtaValue)
      } else {
        throw new Error('MTA Server error: an error occured, please contact a developer.')
      }
    }
    return isUpdate
  }

  static checkZip(path, originalName) {
    return new Promise((resolve, reject) => {
      // Check if zip file is named properly
      let namePrefix = originalName.split('-')
      if (
        namePrefix === -1 ||
				!validGameModePrefixes.includes(namePrefix[0].toLowerCase())
      ) {
        let gamemodeString = ''
        for (const mode of this.validGameModePrefixes) {
          gamemodeString = gamemodeString + mode + '-, '
        }

        return reject(
          Error(
            "'" +
							originalName +
							"' does not have a valid prefix in its filename. File name should start with gamemode like: " +
							gamemodeString
          )
        )
      }
      namePrefix = namePrefix[0].toLowerCase()

      // Check if zip file contains illegal characters
      const fileNameWithoutExtension = originalName.replace('.zip', '')
      const regex = /[^A-z0-9-_]/
      if (fileNameWithoutExtension.match(regex)) {
        return reject(
          Error(
            "'" +
							originalName +
							"' contains illegal characters. (allowed: A-z, 0-9, _)"
          )
        )
      }

      // Check actual zip file
      const zip = new AdmZip(path)
      if (!zip) {
        return reject(
          Error('Could not read zip file')
        )
      }

      const returnErr = (message) => {
        return reject(Error(message || ''))
      }

      // Check for disallowed files
      for (const entry of Object.values(zip.getEntries())) {
        if (entry.isDirectory) {
          continue
        }

        const splitName = entry.name.split('.')
        if (splitName.length < 2 || !allowedFileTypes.includes(splitName.pop())) {
          // File disallowed, throw error
          returnErr('"' + entry.name + '" file is not allowed, allowed file types are: ' + allowedFileTypes.join(' , ') + '. If you need a file added to the filter, please contact our staff.')
          return
        }
      }

      // Check if meta.xml is present
      const meta = zip.getEntry('meta.xml')
      if (!meta) {
        // meta.xml not found, throw error
        returnErr(
          'Could not find meta.xml. Be sure it is present in the root of the zip file.'
        )
        return
      }
      // Read meta.xml
      const xmlString = zip.readAsText(meta)

      let infoNode = false
      let mapsAmount = 0
      let mapSrc = false

      let raceModeInfoNode = false
      let raceModeSettingNode = false

      let isCoreMarkersIncludedInMeta = false
      let isNFSArrowIncludedInMeta = false

      const metaParser = new xml2js.Parser()
      // Parse meta.xml
      let parsedMeta
      let parsedMetaErr
      metaParser.parseString(xmlString, function (err, result) {
        if (err) {
          parsedMetaErr = err
          // returnErr("Could not parse meta.xml. Please make sure it's valid.");
        } else {
          parsedMeta = result
        }
      })
      // Check if meta parse error
      if (parsedMetaErr) {
        returnErr(
          'Could not parse meta.xml. Returned error: ' + parsedMetaErr
        )
      }

      // Check if meta is root
      if (!parsedMeta || !parsedMeta.meta) {
        returnErr('No < meta > node in meta.xml.')
      }

      // Check if all script/map/file sources exist
      for (const nodeName in parsedMeta.meta) {
        if (nodeName === 'info' || nodeName === 'settings') {
          if (nodeName === 'info') {
            // Check if info contains 1 child
            if (parsedMeta.meta[nodeName].length !== 1) {
              returnErr('Meta.xml: info node not correct.')
              return
            } else {
              infoNode = parsedMeta.meta[nodeName][0].$
            }
            // Get racemode in info
            raceModeInfoNode = infoNode.racemode || false
          } else if (parsedMeta.meta[nodeName][0].setting) {
            // Settings
            // Get racemode in settings if exists
            for (const setting of parsedMeta.meta[nodeName][0].setting) {
              if (
                setting.$.name === '#racemode' &&
									typeof setting.$.value === 'string'
              ) {
                raceModeSettingNode = setting.$.value
                break
              }
            }
          }
        } else if (
          nodeName === 'script' ||
          nodeName === 'map' ||
          nodeName === 'file' ||
          nodeName === 'config' ||
          nodeName === 'html' ||
          nodeName === 'include'
        ) {
          // Iterate through node
          for (const nodeChildIndex in parsedMeta.meta[nodeName]) {
            const childNode = parsedMeta.meta[nodeName][nodeChildIndex].$
            // Set map
            if (nodeName === 'map') {
              mapsAmount++
              // Check if only one map is present
              if (mapsAmount > 1) {
                returnErr(
                  'Meta.xml: You can only have 1 .map file in your meta.'
                )
                return
              }
              // Check map src
              if (childNode.src) {
                mapSrc = childNode.src
              } else {
                returnErr('Missing .map file src in meta.xml.')
                return
              }
            }

            // Check included coremarkers
            if (nodeName === 'include') {
              if (nodeName === 'include' && (!childNode.resource || childNode.resource === '')) {
                returnErr('Missing resource property in include tag in meta.xml.')
                return
              }

              if (childNode.resource === 'coremarkers') {
                isCoreMarkersIncludedInMeta = true
              }
              if (childNode.resource === 'nfsarrows') {
                isNFSArrowIncludedInMeta = true
              }
              continue
            }

            // Check source
            const theNodeSrc = childNode.src
            if (!theNodeSrc || theNodeSrc === '') {
              returnErr('Missing file src ' + nodeName + ' in meta.xml.')
              return
            } else {
              // Check if source exists
              const doesExist = zip.getEntry(theNodeSrc)
              if (!doesExist) {
                returnErr('Missing file: ' + theNodeSrc)
                return
              }
            }

            // Check script
            if (nodeName === 'script') {
              if (!childNode.type) {
                // Missing type in script node
                returnErr('Missing type (client or server) in meta.xml for: "' + childNode.src + '". Please check your meta.xml.')
                return
              } else if (!areServerFilesAllowed && childNode.type === 'server') {
                // Allow map editor script (mapEditorScriptingExtension_s.lua)
                if (childNode.src !== 'mapEditorScriptingExtension_s.lua') {
                  returnErr('Server script files are not allowed. Please remove "' + childNode.src + '".')
                  return
                }
                // returnErr('Server script files are not allowed. Please remove "' + childNode.src + '".')
                // return
              }
            }
          }
        }
      }
      // Check if info node exists
      if (!infoNode) {
        returnErr('Meta.xml: Missing info node.')
        return
      }
      // Check resource type = map
      if (infoNode.type !== 'map') {
        returnErr('Meta.xml: info node type is not map.')
        return
      }
      // Check gamemode = race
      if (infoNode.gamemodes !== 'race') {
        returnErr('Meta.xml: gamemodes is not race.')
        return
      }
      // Check map scr
      if (!mapSrc) {
        returnErr(' .map file src not found.')
        return
      }

      // Open .map file
      const map = zip.getEntry(mapSrc)
      if (!map) {
        // meta.xml not found, throw error
        returnErr(
          'Could not read ' + mapSrc + ". Please make sure it's valid."
        )
        return
      }
      // Read .map file
      const mapString = zip.readAsText(map)
      // Parse .map
      const mapParser = new xml2js.Parser()
      let parsedMap
      let parsedMapError
      mapParser.parseString(mapString, function (err, result) {
        if (err) {
          parsedMapError = err
        } else {
          parsedMap = result
        }
      })

      if (parsedMapError) {
        returnErr(
          'Could not parse ' + mapSrc + ". Please make sure it's valid."
        )
        return
      }

      // Check included CoreMarkers in .map
      if (parsedMap.map.coremarker && !isCoreMarkersIncludedInMeta) {
        returnErr(
          'You used CoreMarkers in .map file but didn\'t included in meta.xml'
        )
        return
      }

      // Check included NFS arrows in .map
      if (parsedMap.map.nfs_arrow && !isNFSArrowIncludedInMeta) {
        returnErr(
          'You used NFS arrows in .map file but didn\'t included in meta.xml'
        )
        return
      }

      // Resource parsing is ok, do mode checks now

      switch (namePrefix) {
        case 'rtf':
          if (raceModeInfoNode) {
            if (raceModeInfoNode.toUpperCase() !== 'RTF') {
              returnErr('RTF: Not a valid racemode info in meta.xml')
              return
            }
          } else if (raceModeSettingNode) {
            if (
              !(
                raceModeSettingNode.toUpperCase() === 'RTF' ||
									raceModeSettingNode.toUpperCase() === '[ "RTF" ]'
              )
            ) {
              returnErr('RTF: Not a valid racemode setting in meta.xml')
              return
            }
          } else {
            returnErr('RTF: No racemode in meta.xml')
            return
          }
          break
        case 'ctf':
          if (raceModeInfoNode) {
            if (raceModeInfoNode.toUpperCase() !== 'CTF') { returnErr('CTF: Not a valid racemode info in meta.xml') }
          } else if (raceModeSettingNode) {
            if (
              !(
                raceModeSettingNode.toUpperCase() === 'CTF' ||
									raceModeSettingNode.toUpperCase() === '[ "CTF" ]'
              )
            ) {
              returnErr('CTF: Not a valid racemode setting in meta.xml')
              return
            }
          } else {
            returnErr('CTF: No racemode in meta.xml')
            return
          }
          break
        case 'nts':
          if (raceModeInfoNode) {
            if (raceModeInfoNode.toUpperCase() !== 'NTS') {
              returnErr('NTS: Not a valid racemode info in meta.xml')
              return
            }
          } else if (raceModeSettingNode) {
            if (
              !(
                raceModeSettingNode.toUpperCase() === 'NTS' ||
									raceModeSettingNode.toUpperCase() === '[ "NTS" ]'
              )
            ) {
              returnErr('NTS: Not a valid racemode setting in meta.xml')
              return
            }
          } else {
            returnErr('NTS: No racemode in meta.xml')
            return
          }
          break
        case 'sh':
          if (raceModeInfoNode) {
            const validInfoShooterModes = ['SHOOTER']
            if (
              !validInfoShooterModes.includes(raceModeInfoNode.toUpperCase())
            ) {
              returnErr('SH: Not a valid racemode info in meta.xml')
              return
            }
          } else if (raceModeSettingNode) {
            if (
              !(
                raceModeSettingNode.toUpperCase() === 'SHOOTER' ||
									raceModeSettingNode.toUpperCase() === '[ "SHOOTER" ]'
              )
            ) {
              returnErr('SH: Not a valid racemode setting in meta.xml')
              return
            }
          } else {
            returnErr('SH: No racemode in meta.xml')
            return
          }
          break
        case 'dl':
          if (raceModeInfoNode) {
            if (raceModeInfoNode.toUpperCase() !== 'DEADLINE') {
              returnErr('DL: Not a valid racemode info in meta.xml')
              return
            }
          } else if (raceModeSettingNode) {
            if (
              !(
                raceModeSettingNode.toUpperCase() === 'DEADLINE' ||
									raceModeSettingNode.toUpperCase() === '[ "DEADLINE" ]'
              )
            ) {
              returnErr('DL: Not a valid racemode setting in meta.xml')
              return
            }
          } else {
            returnErr('DL: No racemode in meta.xml')
            return
          }
          break
      }

      return resolve({ mode: namePrefix, map: parsedMap })
    })
  }

  static checkMapGamemode(mode, parsedMap) {
    return new Promise((resolve, reject) => {
      if (
        !parsedMap ||
				typeof parsedMap !== 'object' ||
				!parsedMap.map ||
				!parsedMap.map.spawnpoint
      ) {
        reject(Error(mode.toUpperCase + ': Problem reading .map file.'))
        return
      }

      // Count spawnpoints
      const spawnPointAmount =
				Object.keys(parsedMap.map.spawnpoint).length || 0

      switch (mode) {
        case 'rtf':
          const rtfMinSpawn = 50

          // Check spawn
          if (!spawnPointAmount || spawnPointAmount < rtfMinSpawn) {
            reject(
              Error('RTF: Need a minimum of ' + rtfMinSpawn + ' spawn points.')
            )
            return
          }

          // Check flag
          if (
            !parsedMap.map.rtf ||
						Object.keys(parsedMap.map.rtf).length !== 1
          ) {
            reject(
              Error(
                'RTF: Only 1 flag allowed. Currently this map has ' +
									Object.keys(parsedMap.map.rtf).length +
									' flag(s)'
              )
            )
            return
          }
          break
        case 'ctf':
          const ctfCounts = {
            spawnsBlue: 0,
            spawnsRed: 0
          }
          const minTeamSpawns = 25

          // Count team spawns
          for (const spawn of parsedMap.map.spawnpoint) {
            const theTeam = spawn.$.team
            if (!theTeam || typeof theTeam !== 'string') {
              reject(
                Error(
                  "CTF: One or more spawn points have no team. Teams can be either 'red' or 'blue'"
                )
              )
              return
            }

            if (theTeam === 'red') {
              ctfCounts.spawnsRed++
            } else if (theTeam === 'blue') {
              ctfCounts.spawnsBlue++
            } else {
              reject(
                Error(
                  "CTF: One or more spawn points do not have the right team. Teams can be either 'red' or 'blue'"
                )
              )
              return
            }
          }

          // Check blue team spawnpoints
          if (ctfCounts.spawnsBlue < minTeamSpawns) {
            ctfCounts.spawnBlue = ctfCounts.spawnBlue || 0
            reject(
              Error(
                'CTF: Blue team does not have enough spawn points (' +
									ctfCounts.spawnBlue +
									'). Minimum is ' +
									minTeamSpawns +
									'.'
              )
            )
            return
          }

          // Check red team spawnpoints
          if (ctfCounts.spawnsRed < minTeamSpawns) {
            ctfCounts.spawnRed = ctfCounts.spawnRed || 0
            reject(
              Error(
                'CTF: Red team does not have enough spawn points (' +
									ctfCounts.spawnRed +
									'). Minimum is ' +
									minTeamSpawns +
									'.'
              )
            )
            return
          }

          // Check flag count
          if (!parsedMap.map.ctfred) reject(Error('CTF: No red flag found.'))
          if (Object.keys(parsedMap.map.ctfred).length !== 1) {
            reject(
              Error(
                'CTF: Only 1 red flag allowed. You have ' +
									Object.keys(parsedMap.map.ctfred).length
              )
            )
            return
          }

          if (!parsedMap.map.ctfblue) reject(Error('CTF: No blue flag found.'))
          if (Object.keys(parsedMap.map.ctfblue).length !== 1) {
            reject(
              Error(
                'CTF: Only 1 blue flag allowed. You have ' +
									Object.keys(parsedMap.map.ctfblue).length
              )
            )
            return
          }

          break
        case 'nts':
          const ntsMinSpawn = 50

          // Check spawn points
          if (spawnPointAmount < ntsMinSpawn) {
            reject(
              Error(
                'NTS: Not enough spawn points (' +
									spawnPointAmount +
									'). Minimum: ' +
									ntsMinSpawn +
									'.'
              )
            )
            return
          }

          // Check checkpoints
          if (!parsedMap.map.checkpoint) { reject(Error('NTS: No checkpoints found.')) }

          for (const row in parsedMap.map.checkpoint) {
            const allowedCheckpointTypes = ['vehicle', 'boat', 'air', 'custom']
            const theCheckPoint = parsedMap.map.checkpoint[row].$
            const checkpointType = theCheckPoint.nts || false
            const checkPointNumber = row + 1

            if (!checkpointType) {
              reject(
                Error(
                  'NTS: Checkpoint #' +
										checkPointNumber +
										' does not have a valid nts type (missing). Valid nts types are vehicle, boat, air and custom.'
                )
              )
              return
            } else if (!allowedCheckpointTypes.includes(checkpointType)) {
              reject(
                Error(
                  'NTS: Checkpoint #' +
										checkPointNumber +
										' does not have a valid nts type (' +
										checkpointType +
										'). Valid nts types are vehicle, boat, air and custom.'
                )
              )
              return
            }
          }
          break
        case 'sh':
        case 'dd':
        case 'dl':
          const ShDdDlMinSpawns = 50

          // Check spawns
          if (spawnPointAmount < ShDdDlMinSpawns) {
            reject(
              Error(
                mode.toUpperCase() +
									': Not enough spawn points (' +
									spawnPointAmount +
									'). Minimum: ' +
									ShDdDlMinSpawns +
									'.'
              )
            )
            return
          }

          // Check if spawn points exists
          if (parsedMap.map.checkpoint) {
            reject(Error(mode.toUpperCase() + ': No checkpoints allowed.'))
            return
          }
          break

        case 'race':
          const raceMinSpawn = 50
          // Check spawns
          if (spawnPointAmount < raceMinSpawn) {
            reject(
              Error(
                'RACE: Not enough spawn points (' +
									spawnPointAmount +
									'). Minimum: ' +
									raceMinSpawn +
									'.'
              )
            )
            return
          }

          // Check if spawn points exists
          if (
            !parsedMap.map.checkpoint ||
						Object.keys(parsedMap.map.checkpoint).length === 0
          ) {
            reject(Error('RACE: No checkpoints found.'))
            return
          }
          break
        default:
          // gamemode not found, reject
          reject(Error('Gamemode not valid.'))
          return
      }

      resolve()
    })
  }

  // Map Log
  // TODO: Implement server side pagination
  static async getMapLog(page) {
    // Return last 1000, no pagination
    let mapLog
    const query =
				'SELECT * FROM `uploaded_maps` ORDER BY `uploadid` DESC LIMIT ?'
    try {
      mapLog = await mtaServersDb.query(query, 1000)
      mapLog = JSON.parse(JSON.stringify(mapLog))
    } catch (err) {
      throw new Error(err.message || err)
    }
    return mapLog
  }

  static async unpackZip(zipPath, extractionPath) {
    const zip = new AdmZip(zipPath)
    const extract = util.promisify(zip.extractAllToAsync)
    await extract(extractionPath, true)
  }

  static async searchMapLog(searchQuery) {
    if (typeof searchQuery !== 'string') {
      throw new Error('Invalid search query.')
    }
    searchQuery = '%' + searchQuery + '%'
    // Do search stuff
    const query =
				'SELECT * FROM `uploaded_maps` WHERE `resname` LIKE ? ORDER BY `uploadid` DESC LIMIT 100'
    let results
    try {
      // String already santized
      results = await mtaServersDb.query(query, searchQuery)
      results = JSON.parse(JSON.stringify(results))
    } catch (err) {
      console.log(err)
      throw new Error(err || 'Problem searching through database.')
    }

    return results
  }
}

module.exports = mapUploads
