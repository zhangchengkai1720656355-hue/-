function headersToObject(headers) {
  const result = {}

  if (!headers || typeof headers.forEach !== 'function') {
    return result
  }

  headers.forEach((value, key) => {
    result[String(key).toLowerCase()] = value
  })

  return result
}

async function parseBody(request) {
  const method = String(request.method || 'GET').toUpperCase()

  if (method === 'GET' || method === 'HEAD') {
    return undefined
  }

  const contentType = String(request.headers.get('content-type') || '').toLowerCase()
  const text = await request.text()

  if (!text) {
    return undefined
  }

  if (contentType.includes('application/json')) {
    try {
      return JSON.parse(text)
    } catch (error) {
      return {}
    }
  }

  if (contentType.includes('application/x-www-form-urlencoded')) {
    const params = new URLSearchParams(text)
    return Object.fromEntries(params.entries())
  }

  return text
}

function createReq(request, body) {
  const url = new URL(request.url)

  return {
    method: String(request.method || 'GET').toUpperCase(),
    url: request.url,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: headersToObject(request.headers),
    body
  }
}

function createRes() {
  const headers = new Headers()
  const state = {
    statusCode: 200,
    body: '',
    ended: false
  }

  const res = {
    status(code) {
      state.statusCode = Number(code) || 200
      return res
    },
    setHeader(name, value) {
      headers.set(name, String(value))
      return res
    },
    getHeader(name) {
      return headers.get(name)
    },
    json(payload) {
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json; charset=utf-8')
      }
      state.body = JSON.stringify(payload)
      state.ended = true
      return res
    },
    end(payload) {
      if (typeof payload === 'undefined' || payload === null) {
        state.body = ''
      } else if (typeof payload === 'string') {
        state.body = payload
      } else {
        state.body = String(payload)
      }
      state.ended = true
      return res
    },
    redirect(target, statusCode) {
      if (typeof statusCode === 'number') {
        state.statusCode = statusCode
      } else if (state.statusCode < 300 || state.statusCode >= 400) {
        state.statusCode = 302
      }
      headers.set('location', String(target))
      state.body = ''
      state.ended = true
      return res
    }
  }

  return { res, state, headers }
}

export async function runNodeHandler(context, handler) {
  const request = context.request
  const body = await parseBody(request.clone())
  const req = createReq(request, body)
  const { res, state, headers } = createRes()
  const result = await handler(req, res)

  if (result instanceof Response) {
    return result
  }

  if (!state.ended) {
    state.body = typeof result === 'undefined' ? '' : String(result)
  }

  return new Response(state.body, {
    status: state.statusCode,
    headers
  })
}
