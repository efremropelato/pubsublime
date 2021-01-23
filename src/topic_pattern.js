export const mqttParse = (topic) => {
  let result = String(topic).split('/')
  for (let i = 0; i < result.length; i++) {
    if (result[i] === '+') {
      result[i] = '*'
    }
  }
  return result
}

export const wampParse = (topic) => {
  return String(topic).split('.')
}

export const defaultParse = (topic) => {
  return String(topic).split('.')
}

export const restoreUri = (topic) => {
  return topic.join('.')
}

export const restoreMqttUri = (topic) => {
  return topic.join('/')
}

export const mqttMatch = (topic, filter) => {
  return match(mqttParse(topic), mqttParse(filter))
}

export const wampMatch = (topic, filter) => {
  return match(wampParse(topic), wampParse(filter))
}

// match topic to pattern
export const match = (topicArray, patternArray) => {
  const length = patternArray.length

  for (var i = 0; i < length; ++i) {
    let pattern = patternArray[i]
    let topic = topicArray[i]
    if (pattern === '#') return topicArray.length >= length - 1
    if (pattern !== '*' && pattern !== topic) return false
  }
  return length === topicArray.length
}

// pattern fits shape
export const intersect = (patternArray, shapeArray) => {
  const length = Math.min(patternArray.length, shapeArray.length)

  for (var i = 0; i < length; ++i) {
    let shape = shapeArray[i]
    let pattern = patternArray[i]
    if (shape === '#' || pattern === '#') return true
    if (shape !== pattern && pattern !== '*' && shape !== '*') return false
  }
  if (patternArray.length > shapeArray.length) {
    return patternArray[length] === '#'
  }
  if (patternArray.length < shapeArray.length) {
    return shapeArray[length] === '#'
  }
  return true
}

export const extract = (topicArray, patternArray) => {
  var res = []
  const length = patternArray.length

  for (var i = 0; i < length; ++i) {
    let pattern = patternArray[i]
    if (pattern === '#') {
      if (i <= topicArray.length) {
        return res.concat(topicArray.slice(i))
      } else {
        return null
      }
    }
    let topic = topicArray[i]
    if (pattern === '*') {
      res.push(topic)
    } else if (pattern !== topic) {
      return null
    }
  }
  if (length === topicArray.length) {
    return res
  } else {
    return null
  }
}

export const mqttExtract = (topic, pattern) => {
  return extract(mqttParse(topic), mqttParse(pattern))
}

export const merge = (topicArray, patternArray) => {
  var res = []
  const length = patternArray.length

  let k = 0
  for (var i = 0; i < length; ++i) {
    let pattern = patternArray[i]
    if (pattern === '#') {
      if (k <= topicArray.length) {
        return res.concat(topicArray.slice(k))
      } else {
        return null
      }
    }
    let topic = topicArray[k]
    if (pattern === '*') {
      res.push(topic)
      k++
    } else {
      res.push(pattern)
    }
  }
  return res
}
