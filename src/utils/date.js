import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/es'

dayjs.extend(relativeTime)
dayjs.locale('es')

export const formatDate = (date, format = 'DD/MM/YYYY') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const formatDateISO = (date) => {
  if (!date) return ''
  return dayjs(date).format('YYYY-MM-DD')
}

export const formatDateTime = (date, format = 'DD/MM/YYYY HH:mm') => {
  if (!date) return ''
  return dayjs(date).format(format)
}

export const fromNow = (date) => {
  if (!date) return ''
  return dayjs(date).fromNow()
}

export default dayjs
