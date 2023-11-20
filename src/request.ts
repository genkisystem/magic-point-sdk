import axios from 'axios'

const createRequest = function (apiUrl: string, timeout: number) {
  const client = axios.create({
    baseURL: apiUrl,
    timeout: timeout
  })
  let requestArray: string[] = []
  const post = async function (path: string, reqObj: object) {
    if (reqObj === null) {
      reqObj = {}
    }
    if (
      requestArray.indexOf(
        'post' + ':' + path + ':' + JSON.stringify(reqObj)
      ) !== -1
    ) {
      return
    }
    requestArray.push('post' + ':' + path + ':' + JSON.stringify(reqObj))
    // eslint-disable-next-line no-return-await
    return await doRequest('post', path, reqObj)
  }

  const get = async function (path: string, reqObj: object) {
    if (reqObj === null) {
      reqObj = {}
    }
    if (
      requestArray.indexOf(
        'get' + ':' + path + ':' + JSON.stringify(reqObj)
      ) !== -1
    ) {
      return
    }
    requestArray.push('get' + ':' + path + ':' + JSON.stringify(reqObj))
    // eslint-disable-next-line no-return-await
    return await doRequest('get', path, reqObj)
  }

  const put = async function (path: string, reqObj: object) {
    if (reqObj === null) {
      reqObj = {}
    }
    if (
      requestArray.indexOf(
        'put' + ':' + path + ':' + JSON.stringify(reqObj)
      ) !== -1
    ) {
      return
    }
    requestArray.push('put' + ':' + path + ':' + JSON.stringify(reqObj))
    // eslint-disable-next-line no-return-await
    return await doRequest('put', path, reqObj)
  }

  const del = async function (path: string, reqObj: object) {
    if (reqObj === null) {
      reqObj = {}
    }
    if (
      requestArray.indexOf(
        'del' + ':' + path + ':' + JSON.stringify(reqObj)
      ) !== -1
    ) {
      return
    }
    requestArray.push('del' + ':' + path + ':' + JSON.stringify(reqObj))
    // eslint-disable-next-line no-return-await
    return await doRequest('delete', path, reqObj)
  }
  const doRequest = async function (method: string, path: string, reqObj: object) {

    // Add token to request header
    // let token = store.getters['login/getToken']
    // if (token && (typeof token === 'string' || token instanceof String)) {
    //   client.defaults.headers.common['X-Auth-Token'] = token
    // } else {
    //   client.defaults.headers.common['X-Auth-Token'] = ''
    // }

    try {
      const response = await (client as any)[method](path, reqObj)
      spliceRequestArray(method + ':' + path + ':' + JSON.stringify(reqObj))
      if (response.data.hasError) {
        throw new Error(response.data.message || 'message.BOOK_SERVICE_ERROR')
      }
      return response.data
    } catch (error: any) {
      spliceRequestArray(method + ':' + path + ':' + JSON.stringify(reqObj))
      if (error.response && error.response.status === 401) {
        // store.commit('login/LOG_OUT')
        // router.push('/error')
        return
      }
      return {
        hasError: true,
        message: error.message ? error.message : 'Unexpected Error',
        appData: null
      }
    }
  }

  const spliceRequestArray = function (value: any) {
    for (let i = 0; i < requestArray.length; i++) {
      if (requestArray[i] === value) {
        requestArray.splice(i, 1)
      }
    }
  }

  return {
    post: post,
    put: put,
    get: get,
    del: del
  }
}
export const bookServiceAsync = createRequest(
  'http://localhost:8080/api/',
  360000
)