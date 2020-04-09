let bus = window.bus

if (!bus) {
  bus = (() => {})
  bus.fetch = (() => {})
}

export { bus }