'use client'

import Image from 'next/image'

interface IPhoneMessagePreviewProps {
  message: string
  mediaUrl?: string
  channel: 'sms' | 'whatsapp' | 'whatsapp-cloud'
  recipientCount: number
  senderName?: string
}

export function IPhoneMessagePreview({
  message,
  mediaUrl,
  channel,
  recipientCount,
  senderName = 'Cave Express'
}: IPhoneMessagePreviewProps) {
  const getChannelConfig = () => {
    switch (channel) {
      case 'sms':
        return {
          bubbleColor: 'bg-gray-200',
          textColor: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            </svg>
          ),
          label: 'SMS',
          headerBg: 'bg-gray-100'
        }
      case 'whatsapp':
        return {
          bubbleColor: 'bg-[#dcf8c6]',
          textColor: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          ),
          label: 'WhatsApp',
          headerBg: 'bg-[#075e54]'
        }
      case 'whatsapp-cloud':
        return {
          bubbleColor: 'bg-[#dcf8c6]',
          textColor: 'text-gray-900',
          icon: (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          ),
          label: 'WhatsApp Cloud',
          headerBg: 'bg-gradient-to-r from-[#075e54] to-[#128c7e]'
        }
    }
  }

  const config = getChannelConfig()

  return (
    <div className="relative flex flex-col items-center">
      {/* iPhone Mockup Container */}
      <div className="relative w-[300px] h-[600px]">
        {/* iPhone Frame Image - background */}
        <Image
          src="/images/iphone-1200x2364.png"
          alt="iPhone"
          fill
          className="object-contain pointer-events-none"
          priority
        />

        {/* Screen Content Area - ON TOP of frame, precisely positioned */}
        <div className="absolute inset-0 flex items-center justify-center z-20">
          <div
            className="w-[254px] h-[548px] mt-[2px] rounded-[42px] overflow-hidden flex flex-col"
            style={{
              background: channel === 'sms'
                ? '#f2f2f7'
                : '#e5ddd5'
            }}
          >
            {/* Header */}
            <div className={`${config.headerBg} px-3 pt-12 pb-3 flex items-center gap-2`}>
              {channel !== 'sms' && (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white text-sm font-bold">CE</span>
                </div>
              )}
              <div className={channel === 'sms' ? 'text-gray-900' : 'text-white'}>
                <div className="font-semibold text-xs">{senderName}</div>
                {channel !== 'sms' && (
                  <div className="text-[10px] opacity-80">en ligne</div>
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 p-2 overflow-y-auto relative"
              style={{
                background: channel === 'sms'
                  ? '#ffffff'
                  : '#e5ddd5'
              }}
            >
              {/* WhatsApp wallpaper pattern */}
              {channel !== 'sms' && (
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M20 20h-4v-4h4v4zm0-8h-4v-4h4v4zm8 8h-4v-4h4v4zm-16 0H8v-4h4v4zm8 8h-4v-4h4v4z'/%3E%3C/g%3E%3C/svg%3E")`
                  }}
                />
              )}

              {message ? (
                <div className="space-y-2 relative z-10">
                  {/* Media Preview */}
                  {mediaUrl && mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i) && (
                    <div className="max-w-[180px] ml-auto">
                      <div className={`${config.bubbleColor} rounded-lg overflow-hidden shadow-sm`}>
                        <img
                          src={mediaUrl}
                          alt="Media"
                          className="w-full h-auto max-h-[100px] object-cover"
                        />
                      </div>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div className="max-w-[180px] ml-auto">
                    <div
                      className="rounded-lg px-2.5 py-1.5 shadow-sm relative"
                      style={{
                        backgroundColor: channel === 'sms' ? '#e5e5ea' : '#dcf8c6',
                        color: '#000000'
                      }}
                    >
                      <p className="text-[11px] whitespace-pre-wrap break-words leading-relaxed" style={{ color: '#000000' }}>
                        {message}
                      </p>
                      <div className="flex items-center justify-end gap-1 mt-0.5">
                        <span className="text-[9px]" style={{ color: '#666666' }}>
                          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {channel !== 'sms' && (
                          <svg className="w-2.5 h-2.5 text-blue-500" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M13.854 3.646a.5.5 0 010 .708l-7 7a.5.5 0 01-.708 0l-3.5-3.5a.5.5 0 11.708-.708L6.5 10.293l6.646-6.647a.5.5 0 01.708 0z"/>
                          </svg>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-[11px] text-center px-3" style={{ color: '#999999' }}>
                    Tapez votre message...
                  </p>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-1.5 flex items-center gap-1.5" style={{ backgroundColor: channel === 'sms' ? '#f2f2f7' : '#f0f0f0' }}>
              <div className="flex-1 bg-white rounded-full px-2.5 py-1.5 flex items-center border border-gray-200">
                <span className="text-[10px]" style={{ color: '#999999' }}>Message</span>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                channel === 'sms' ? 'bg-blue-500' : 'bg-[#25d366]'
              }`}>
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Channel Badge & Recipient Count */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-medium ${
          channel === 'sms' ? 'bg-blue-600' : 'bg-[#25d366]'
        }`}>
          {config.icon}
          <span>{config.label}</span>
        </div>

        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{recipientCount.toLocaleString()}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">destinataire{recipientCount !== 1 ? 's' : ''}</div>
        </div>
      </div>
    </div>
  )
}
