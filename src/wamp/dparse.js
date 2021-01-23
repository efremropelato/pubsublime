export const dparse = (data) => {
  let args, kwargs
  if (data === null) {
    args = []
    kwargs = undefined
  } else
  if (data.args !== undefined) {
    args = data.args
    kwargs = data.kwargs
  }
  else if (data.payload !== undefined) {
    if (data instanceof Array) {
      args = JSON.parse(data.payload)
      kwargs = undefined
    } else {
      args = []
      kwargs = JSON.parse(data.payload)
    }
  }
  else {
    args = []
    kwargs = data.kv
  }
  return [args, kwargs]
}
