function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function handleOptions(req, res) {
  if (req.method !== 'OPTIONS') {
    return false
  }

  setCors(res)
  res.status(204).end()
  return true
}

function sendJson(res, statusCode, payload) {
  setCors(res)
  res.status(statusCode).json(payload)
}

module.exports = {
  handleOptions,
  sendJson,
  setCors
}
