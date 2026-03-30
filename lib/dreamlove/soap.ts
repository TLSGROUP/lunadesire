// ============================================================
// DreamLove SOAP client — based on official integration manual v3.1
// Endpoint: https://store.dreamlove.es/webservices/orderservice.php
// WSDL:     https://store.dreamlove.es/webservices/orderservice_wsdl.php
// ============================================================

import type {
  DreamLoveOrderPayload,
  DreamLoveOrderResult,
  DreamLoveStockInfo,
} from './types'

const SOAP_ENDPOINT = process.env.DREAMLOVE_SOAP_URL!
const DL_USER = process.env.DREAMLOVE_USERNAME!
const DL_PASS = process.env.DREAMLOVE_PASSWORD!
// resource_string from the DreamLove integration credentials
const DL_RESOURCE = process.env.DREAMLOVE_TOKEN!

function soapEnvelope(body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:web="http://www.dreamlove.es/webservice/">
  <soapenv:Header/>
  <soapenv:Body>${body}</soapenv:Body>
</soapenv:Envelope>`
}

async function soapRequest(action: string, body: string): Promise<string> {
  const res = await fetch(SOAP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: action,
    },
    body: soapEnvelope(body),
    cache: 'no-store',
  })

  const text = await res.text()
  if (!res.ok) {
    throw new Error(`SOAP HTTP error ${res.status}: ${text.slice(0, 300)}`)
  }
  return text
}

// ---- getLogisticsFiles -----------------------------------------
// getLogisticsFiles(auth_mode, username, password)

export interface DreamLoveShippingMethod {
  code: string
  description: string
  price: number
  freeFrom?: number
  countriesCsv?: string   // e.g. 'ESP,PRT' — countries this method applies to
}

export async function getLogisticsFiles(): Promise<DreamLoveShippingMethod[]> {
  const body = `
    <web:getLogisticsFiles>
      <web:auth_mode>basic</web:auth_mode>
      <web:username>${escapeXml(DL_USER)}</web:username>
      <web:password>${escapeXml(DL_PASS)}</web:password>
    </web:getLogisticsFiles>`

  const xml = await soapRequest('getLogisticsFiles', body)
  return parseLogisticsResponse(xml)
}

function parseLogisticsResponse(xml: string): DreamLoveShippingMethod[] {
  // Response is a SOAP Map: <item><key>shippingFees</key><value>...encoded xml...</value></item>
  // Extract the value after the shippingFees key
  const keyValueMatch = xml.match(
    /<key[^>]*>shippingFees<\/key>\s*<value[^>]*>([\s\S]*?)<\/value>/,
  )
  if (!keyValueMatch) return []

  // Triple-decode: &amp;amp;lt; → &amp;lt; → &lt; → <
  const feesXml = decodeXmlEntities(decodeXmlEntities(decodeXmlEntities(keyValueMatch[1])))

  const methods: DreamLoveShippingMethod[] = []
  const sfRegex = /<sf>([\s\S]*?)<\/sf>/gi
  let match

  while ((match = sfRegex.exec(feesXml)) !== null) {
    const sf = match[1]
    const code = extractTag(sf, 'code')
    const desc = extractTag(sf, 'desc')
    const price = extractTag(sf, 'precio')
    const freeFrom = extractTag(sf, 'gratis_desde')

    const countriesCsv = extractTag(sf, 'countries_csv')

    if (code && desc) {
      methods.push({
        code,
        description: decodeXmlEntities(desc),
        price: price ? parseFloat(price) : 0,
        freeFrom: freeFrom && freeFrom.trim() ? parseFloat(freeFrom) : undefined,
        countriesCsv: countriesCsv?.trim() || undefined,
      })
    }
  }

  return methods
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

// ---- getBasicProductInfo ----------------------------------------
// getBasicProductInfo(auth_mode, username, password, resource_string,
//                     product_id, stock_info_disaggregated, add_variations_stock_info)

export async function getBasicProductInfo(
  dreamloveId: string,
): Promise<DreamLoveStockInfo> {
  const body = `
    <web:getBasicProductInfo>
      <web:auth_mode>basic</web:auth_mode>
      <web:username>${escapeXml(DL_USER)}</web:username>
      <web:password>${escapeXml(DL_PASS)}</web:password>
      <web:resource_string>${escapeXml(DL_RESOURCE)}</web:resource_string>
      <web:product_id>${escapeXml(dreamloveId)}</web:product_id>
      <web:stock_info_disaggregated>0</web:stock_info_disaggregated>
      <web:add_variations_stock_info>0</web:add_variations_stock_info>
    </web:getBasicProductInfo>`

  const xml = await soapRequest('getBasicProductInfo', body)
  return parseBasicProductInfoResponse(dreamloveId, xml)
}

function parseBasicProductInfoResponse(
  dreamloveId: string,
  xml: string,
): DreamLoveStockInfo {
  // Response fields per manual: status, available, availableStock, cost_price, price
  const status = extractTag(xml, 'status')
  const available = extractTag(xml, 'available')
  const stock = extractTag(xml, 'availableStock')
  const costPrice = extractTag(xml, 'cost_price')

  return {
    dreamloveId,
    available: status === '1' && available === '1',
    stock: stock ? parseInt(stock, 10) : 0,
    price: costPrice ? parseFloat(costPrice) : undefined,
    rawXml: xml,
  }
}

// ---- newOrder ---------------------------------------------------
// newOrder(auth_mode, username, password, order_id, order_xml)

export async function newOrder(
  payload: DreamLoveOrderPayload,
): Promise<DreamLoveOrderResult> {
  const orderXml = buildOrderXml(payload)

  const body = `
    <web:newOrder>
      <web:auth_mode>basic</web:auth_mode>
      <web:username>${escapeXml(DL_USER)}</web:username>
      <web:password>${escapeXml(DL_PASS)}</web:password>
      <web:order_id>${escapeXml(payload.referenceId)}</web:order_id>
      <web:order_xml>${escapeXml(orderXml)}</web:order_xml>
    </web:newOrder>`

  const xml = await soapRequest('newOrder', body)
  return parseNewOrderResponse(xml)
}

function buildOrderXml(payload: DreamLoveOrderPayload): string {
  const s = payload.shipping
  const today = new Date().toISOString().slice(0, 10)

  // CountryCode must be ISO 3166-1 alpha-3
  const countryCode = toAlpha3(s.country)

  const itemsXml = payload.items
    .map(
      (i) => `
    <OrderLine>
      <ProductID>${escapeXml(i.dreamloveId)}</ProductID>
      <Quantity>${i.quantity}</Quantity>
    </OrderLine>`,
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<GesioOrder>
  <FileHeader><SchemaVersion>1.0</SchemaVersion></FileHeader>
  <Order>
    <OrderHeader>
      <OrderIdentifier>${escapeXml(payload.referenceId)}</OrderIdentifier>
      <DesiredDeliveryDate>${today}</DesiredDeliveryDate>
      <ShippingAddress>
        <GlobalAddress>
          <Address><![CDATA[${s.street}]]></Address>
          <PostCode>${escapeXml(s.postalCode)}</PostCode>
          <Town><![CDATA[${s.city}]]></Town>
          <Province></Province>
          <CountryCode>${countryCode}</CountryCode>
        </GlobalAddress>
      </ShippingAddress>
      <BuyerContactData>
        <OrderContact>
          <ContactData>
            <FullName><![CDATA[${s.name}]]></FullName>
            <PhoneNumber>${escapeXml(s.phone)}</PhoneNumber>
            <EmailAddress>${escapeXml(s.email)}</EmailAddress>
          </ContactData>
        </OrderContact>
      </BuyerContactData>
      <dropshipping>
        <es_dropshipping>1</es_dropshipping>
      </dropshipping>
    </OrderHeader>
    <OrderIssueData>
      <OrderCurrencyCode>EUR</OrderCurrencyCode>
      <IssueDate>${today}</IssueDate>
    </OrderIssueData>
    <Items>${itemsXml}
    </Items>
  </Order>
</GesioOrder>`
}

function parseNewOrderResponse(xml: string): DreamLoveOrderResult {
  const status = extractTag(xml, 'status')
  const dreamloveOrderId = extractTag(xml, 'dreamloveOrderId')
  const errorCode = extractTag(xml, 'errorCode')
  const errorDescription = extractTag(xml, 'errorDescription')

  if (status !== '1') {
    return {
      success: false,
      errorMessage: errorDescription
        ? `[${errorCode}] ${errorDescription}`
        : `Error code: ${errorCode}`,
      rawXml: xml,
    }
  }

  return {
    success: true,
    dreamloveOrderId: dreamloveOrderId ?? undefined,
    rawXml: xml,
  }
}

// ---- Helpers ---------------------------------------------------

function extractTag(xml: string, tag: string): string | null {
  // Matches plain text or CDATA content: <tag>text</tag> or <tag><![CDATA[text]]></tag>
  const match = xml.match(
    new RegExp(`<${tag}>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([^<]*))<\\/${tag}>`, 'i'),
  )
  if (!match) return null
  return (match[1] ?? match[2] ?? '').trim()
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Basic ISO 3166-1 alpha-2 → alpha-3 mapping for common countries
const alpha2to3: Record<string, string> = {
  US: 'USA', GB: 'GBR', DE: 'DEU', FR: 'FRA', ES: 'ESP', IT: 'ITA',
  NL: 'NLD', BE: 'BEL', AT: 'AUT', CH: 'CHE', PL: 'POL', CZ: 'CZE',
  SK: 'SVK', HU: 'HUN', RO: 'ROU', PT: 'PRT', SE: 'SWE', NO: 'NOR',
  DK: 'DNK', FI: 'FIN', UA: 'UKR', RU: 'RUS', BY: 'BLR',
}

function toAlpha3(code: string): string {
  if (code.length === 3) return code.toUpperCase()
  return alpha2to3[code.toUpperCase()] ?? code.toUpperCase()
}
