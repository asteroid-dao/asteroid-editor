import { Quill } from 'react-quill'
import { isNil } from 'ramda'
const BlockEmbed = Quill.import('blots/block/embed')

class LoadingImage extends BlockEmbed {
  static create(src) {
    const id = typeof src === 'string' ? src.split(',').pop() : null
    if (isNil(id)) return null
    const image_map = window.image_map || {}
    const node = super.create(image_map[id].url)
    if (src === true) return node

    const image = document.createElement('img')
    image.setAttribute('src', image_map[id].url)
    node.appendChild(image)
    return node
  }
  deleteAt(index, length) {
    super.deleteAt(index, length)
    this.cache = {}
  }
  static value(domNode) {
    const { src, custom } = domNode.dataset
    return { src, custom }
  }
}

LoadingImage.blotName = 'imageBlot'
LoadingImage.className = 'image-uploading'
LoadingImage.tagName = 'span'

export default LoadingImage
