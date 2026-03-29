## INTEGRATION MANUAL ACCESS TO WEBSERVICE SOAP DREAMLOVE

Integration with Dreamlove: Product catalog and order generation.
## Developer Guide
## Version 3.1
## 1   Introduction

This document is intended as a quick guide that helps in the integration of Dreamlove systems with that
of its customers.

The document is divided into two large blocks: "Product catalog" and "Order generation".

2   Product catalog:

To obtain the catalog data we recommend two phases:

-  Download  and  process  a  feed  with  full  catalog  data  via  http:  Dreamlove  will  provide  you  with  the
URLs of your catalog feed. Some will correspond to the XML version and others to the CSV version of
it.
Below we offer the updated url routes but you can also access these URLs in the "Export catalog" section
of your user area at store.dreamlove.es.

Fictional URL examples:
## •
https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_50_125_2_eb10a792c0336b
c695e2b0ec29d88402_xml_plain.xml
- https://store.dreamlove.es/dyndata/exportaciones/csvzip/catalog_1_50_125_2_eb10a792c0336b
c695e2b0ec29d88402_csv_plain.csv
From the same section of your user area you will also have access to compressed (zip) versions of these
feed and other feed.

NOTE: these feed are generated with an hourly periodicity. (Approximately every 30 minutes)


- Webservice SOAP access to the main data of the products. This service is more suitable for
obtaining real-time stock for example when a customer is adding a product to their 'shopping
cart'.

To use the webservice you must request a specific user from Dreamlove (You can request it in the
catalog export area or webservice@dreamlove.es). In response to this request we will send the
following access data to the webservice:
Username: your_service_user_name
Access password: your_service_user_password
Resource identifier: your_ resource_identifier (productIdFormat = dreamloveid)

- URL of the webservice: https://store.dreamlove.es/webservices/orderservice.php
- URL of the webservice WSDL: https://store.dreamlove.es/webservices/orderservice_wsdl.php

Method of webservice for requesting product data:
getBasicProductInfo(auth_mode, username, password, resource_string, product_id,
stock_info_disaggregated, add_variations_stock_info)


## Parameters:
- auth_mode: must always have the value "basic"
- username: this field corresponds to your username (your_service_user_name)
- password: this field corresponds to your access password (your_service_user_password)
- resource_string: this field corresponds to your resource identifier (your_ resource_identifier)
- product_id: this field corresponds to the numerical identifier of the product you want to consult (no la referencia
del mismo)

- stock_info_disaggregated: must always have the value 0
- add_variations_stock_info: 1 if you want to obtain the stock information of the variations of the same product
(sizes and colors) 0 otherwise

Result, the method returns the following vector:

- status: call result (1 no errors and 0 otherwise)
- errorCode: error code
- errorDescription: error description
- resource: resource_string provided in the method call
- productId: product_id provided in the method call
- sku: Product reference
- barcode: Main product barcode
- dreamloveProductId: Product identifier in dreamlove (with the configuration explained in this manual will match
dreamloveProductId if the product exists)
- name: Product name in the language specified in the resource_string
- available: 1 if the product is available and 0 otherwise
- availableStock: Stock available for sale
- availableStockDisaggregated: This information is not provided with the configuration explained
- cost_price: Product cost price for the dreamlove customer
- price: Recommended retail price for the end customer
- vat: Percentage of product taxes in Spain
- updated: Last modified moment
- modelRef: Model reference (for products with sizes and / or colors)
- size: Size
- Color: Finish or color
- variationsStock: XML with stock information of other sizes and colors related to the product
- log: Information for dreamlove developers

Ejemplo de uso en PHP:

## <?php

## // ...
// In the annexes you can see an example in PHP of how to create the $ client object for calls to the
order webservice
$username = "user webservice ";
$password =  "password webservice";
## $resource_string
## $product_id =
try{
$getBasicProductInfo_response = $client->getBasicProductInfo(
## "basic",
## $username,
## $password,
## $resource_string,
## $product_id,
0, // stock
1 // stock

## );
echo("getBasicProductInfo_response:<pre>"); print_r($getBasicProductInfo_response);
echo("</pre>");
## }
catch(SoapFault $fault){
echo("SoapFault 002:<pre>".$fault->getMessage()."<pre><br />\n");
} // end catch
## /*
## Resultado: Array
## [status] => 1
[resource] => productIdFormat_dreamloveid
[productId] => 303
[sku] => EGG-001
## [barcode] => 4560220550502
[dreamloveProductId] => 303
[name] => MASTURBATOR AUTOMATIC...
## [available] => 1
[availableStock] => 28
[availableStockDisaggregated] =>
## [cost_price] => 3.13
## [price] => 3.13
## [vat] => 21.00
[updated] => 2019-10-04T02:07:38
[modelRef] =>
## [size] =>
## [color] =>
[variationsStock] => <variations></variations>
[errorDescription] =>
[errorCode] =>
## [log] =>
[dreamloveProductId] => 303
## */

## ?>

## 3   Order Generation

Before moving on to the creation of orders, we will present a series of necessary webservice methods
for it:

Logistic information: when the order is sent, the dreamlove logistic rate to which the order is to be
related must be indicated, the rate information can be updated according to Dreamlove contracts.

## Webservice Method;

getLogisticsFiles(auth_mode, username, password)

## Parámeters:
auth_mode: always the same word "basic"
username: user name webservice
password:  password webservice

Resultado: The method returns the following vector
status: 1 if we have error  and 0 if we haven ́t
errorCode:
errorDescription:
countries => xml string with the information of the countries in dreamlove

INTERNATIONAL DREAMLOVE S.L. POL IND LOS PALILLOS CALLE UNO 3 41500 ALCALÁ DE GUADAIRA –
webmaster@dreamlove.es  955630377 www.dreamlove.es  store.dreamlove.es

© Copyright protected 2007/2020   International Dreamlove S.L.

states =>  xml string with the information of the provinces or states in dreamlove
shippingFees =>  xml string with information on available shipping rates

PHP use example:

## <?php

## // ...

$getLogisticsFiles_response = $client->getLogisticsFiles(
## "basic",
## $username,
## $password,
## );

## /*
## Resultado: Array
## [status] => 1
[errorCode] =>
[errorDescription] =>
## [countries] =>
<countries><c><code>01</code><desc><![CDATA[Belarus]]></desc></c><c><code>132</code><desc><![CDATA[Swed
en]]></desc></c><c><code>31</code><desc><![CDATA[Ukraine]]></desc></c><c><code>34</code><desc><![CDATA[
Moldavia]]></desc></c><c><code>38</code><desc><![CDATA[Slovenia]]></desc></c><!-- otros paises... --
## ><countries>
## [states] => <states><st
country="ESP"><code>00001</code><desc><![CDATA[Áraba/Álava]]></desc></st><st
country="ESP"><code>00002</code><desc><![CDATA[Albacete]]></desc></st><st
country="ESP"><code>00003</code><desc><![CDATA[Alacant/Alicante]]></desc></st><!-- otros provincias...
## --></states>
[shippingFees] => <shippingFees><sf><code>0144</code><desc><![CDATA[A NACEX Servicio Express:
Envio 24H Spain RECOGIDA EN OFICINAS (PENINSULA - NO
ISLAS)]]></desc><gratis_desde><![CDATA[100]]></gratis_desde><precio><![CDATA[3.2000]]></precio></sf><sf
><code>0149</code><desc><![CDATA[A NACEX Servicio Express: Envio 24H Portugal RECOGIDA EN OFICINAS
## (PENINSULA - NO
ISLAS)]]></desc><gratis_desde><![CDATA[100]]></gratis_desde><precio><![CDATA[3.2000]]></precio></sf><!-
- otras tarifas --></shippingFees>
## */

## ?>

Information of documents and forms of payment: this information is NOT relevant in the scope of
this document but is briefly stated

## Webservice Method:

getPaymentFiles(auth_mode, username, password)

## Parameters:
auth_mode: always must be "basic"
username: user webservice
password:  password webservice

Result: The method returns the following vector
status: 1 if you have error 0 if you haven ́t
errorCode:
errorDescription:
paymentDocuments
paymentMethods


PHP use example:

## <?php

## // ...

$getPaymentFiles_response = $client->getPaymentFiles(
## "basic",
## $username,
## $password
## );

## /*
## Resultado: Array
## [status] => 1
[errorCode] =>
[errorDescription] =>
[paymentDocuments] =>
<paymentDocuments><pd><code>001</code><desc><![CDATA[GIRO]]></desc></pd><pd><code>002</code><desc><![CD
ATA[TRANSFERENCIA]]></desc></pd><pd><code>003</code><desc><![CDATA[CHEQUE]]></desc></pd><pd><code>004</
code><desc><![CDATA[PAGARÉ]]></desc></pd><pd><code>005</code><desc><![CDATA[METÁLICO]]></desc></pd><pd>
<code>006</code><desc><![CDATA[TARJETA]]></desc></pd><pd><code>007</code><desc><![CDATA[INGRESO
EFECTIVO]]></desc></pd><pd><code>008</code><desc><![CDATA[CONFIRMING]]></desc></pd><pd><code>009</code>
<desc><![CDATA[FINANCIACIÓN]]></desc></pd></paymentDocuments>
[paymentMethods] => <paymentMethods><pm><code>CON</code><desc><![CDATA[CONTRATO
CLIENTE]]></desc></pm><pm><code>30D</code><desc><![CDATA[GIR0 A 30 DIAS]]></desc></pm><!-- Otros
acuerdos de pago --><paymentMethods>
## */

## ?>

## Order Creation:

## Webservice Method:
newOrder(auth_mode, username, password, order_id, order_xml)
## Parameters:
auth_mode: always must be "basic"
username: user webservice
password: pass webservice
order_id:  Order identifier in your system (Must be unique and unrepeatable)
order_xml:  xml string with the order information you want to make to dreamlove (The
format is described in detail below)

Result: The method returns the following vector

- status: call result (1 no errors and 0 otherwise)
- orderId: Order reference in the system
- dreamloveOrderId: Order identifier in the system
- errorCode: error code
- errorDescription: error description
- carrier_name: Name of the selected logistics provider
- tracking_number: Logistic tracking number
- logFilePath: File in the system where the debug log is hosted
- date_of_delivery: Approximate shipping date of the selected logistics (Only with NACEX)
- dreamloveDeliveryNoteId: ID or ID’s of the delivery notes in your system


dreamloveInvoiceId: ID or ID’s of the invoices in your system
The last 3 elements of the vector are renaming or renaming the array keys.

XML format that the order_xml parameter must have:

## Example:
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<GesioOrder>
<FileHeader><SchemaVersion>1.0</SchemaVersion></FileHeader>
<Parties>
<BuyerParty>

<TaxIdentification><TaxIdentificationNumber>ID_FISCAL_FICTICIO</TaxIdentificationNumber></TaxIde
ntification><!--
</BuyerParty>
</Parties>
<Order>
<OrderHeader>
<OrderIdentifier> </OrderIdentifier><!-- The order identifier in your system -->
<DesiredDeliveryDate>2019-10-03</DesiredDeliveryDate><!--
<shippingMethodId>0144</shippingMethodId><!-- Identifier of the shipping method. This
data responds to the code of the rates obtained in shippingFees of getLogisticsFiles (0144: A NACEX
Servicio Express: Envio 24H Spain (PENINSULA - NO ISLAS)) -->
<ShippingAddress>
<GlobalAddress>
<Address><![CDATA[c/ Ficticia nº 3 puerta 4]]></Address><!---->
<PostCode>46006</PostCode><!-- -->
<Town><![CDATA Town><!-- -->
<Province><![CDATA[]]></Province><!-- -->
<CountryCode>GER</CountryCode><!-- ISO 3166-1 alpha-3 (GER: Germany) -->
</GlobalAddress>
</ShippingAddress>
<ShippingDetails>
<!--el 0066 rate shipping cost Correos ( Example ) -->
<ShippingModeCode>0111</ShippingModeCode>
</ShippingDetails>
<BuyerContactData>
<OrderContact>
<ContactData>
<FullName><![CDATA[David Marck ]]></FullName><!—Name final
customer (Final customer) -->
<PhoneNumber>900 000 000</PhoneNumber><!--) -->
<!-- If the email is filled in, the call will lead to waiting time
->                                 <EmailAddress></EmailAddress><!-- Dirección de e-mail del
destinatario (cliente final) -->
<cifAddress>VAT NUMBER </cifAddress><!—VAT NUMBER FINAL CUSTOMER
## (FINAL CUSTOMER) -->
</ContactData>
</OrderContact>
</BuyerContactData>
## <dropshipping>
<es_dropshipping>1</es_dropshipping><!-- If it is a dropshipping order it is
specified with 1 ->                 <importcontra_dropshipping>2.00</importcontra_dropshipping><!--
This information should only be provided if it is a cash on delivery request. -->
## </dropshipping>
</OrderHeader>
<OrderIssueData>
<OrderCurrencyCode>EUR</OrderCurrencyCode>
<TaxCurrencyCode></TaxCurrencyCode>
<IssueDate>2019-10-02</IssueDate>
</OrderIssueData>
<Items>
<OrderLine><!-- 1º order line -->
<ProductID>5512</ProductID>
<ProductReference><![CDATA[D-201692]]></ProductReference><!—Item number Dreamlove
ProductID -->
<Quantity>2</Quantity><!—  -->
</OrderLine>
<OrderLine><!-- 2ª -->
<ProductID>12</ProductID>
<ProductReference><![CDATA[D57-149009]]></ProductReference>
<Quantity>1</Quantity>
</OrderLine> <!--  You would specify as many OrderLine as lines have the order Se -->
</Items>
</Order>
</GesioOrder>

PHP use example:

## <?php

$newOrder_response = $client->newOrder(
## "basic",
## $auth_mode,
## $password,
## $order_id,
$order_xml // utf8 encoded
## );

## /*
## Resultado: Array(
## [status] => 1
[orderId] => PRUEBAS_99999D
[errorCode] =>
[errorDescription] =>
[carrier_name] => MRW
## [tracking_number] => 023330504327
[logFilePath] =>
../tmp_dir/importaciones_remotas/pedidos/logs/2019_10_07/20191007174136_newOrder_PRUEBAS_99999D.log
## [date_of_delivery] =>
[dreamloveOrderId] => 99999
[dreamloveDeliveryNoteId] => 3333
[dreamloveInvoiceId] => 4444

## )
## */


## ?>
## 4   ANNEXES:

PHP code for the creation of the $ client object used in calls to the order webservice:

## <?php

$clientArgs = array(
'trace' => 1, // 0 when the integration has already been developed (1 is for debugging)
'connection_timeout' => 30, // maximum timeout seconds
'soap_version' => "SOAP_1_1",
## 'encoding' => "utf-8",
'cache_wsdl' => WSDL_CACHE_NONE, // WSDL_CACHE_NONE, WSDL_CACHE_BOTH
## );

$wsdlUri = "https://store.dreamlove.es/webservices/orderservice_wsdl.php";
try{
$client = new SoapClient($wsdlUri, $clientArgs);
## }
catch(SoapFault $fault){ echo("SoapFault: ".$fault->getMessage()."<br />\n"); } // end catch

## ?>

Most frequent error codes of the newOrder method:
## Código Descripción
4 An order with the same identifier already existed in the system.
8 y 15 The order could not be accepted due to insufficient balance.
10 y 27 The specified logistic rate is not found.
11 y 28 I have not specified the logistics rate
16 You have exceeded the limit of items allowed in an order.
17 y 58 Insufficient stock
18 An error occurred while generating the shipping label
20 y 47 Formatting or coding error in the order descriptive XML.
29 Error storing shipping information
48, 101 y 102 The user is not found or the password is incorrect
52 y 76 The order identifier (orderId) cannot be empty
53 The order data (orderData) cannot be empty.
55 Quantities are not allowed on line items that are not positive integers.
57 The specified quantity does not reach the minimum number of units.
59 y 60 Product not found
63 The product identifier (productId) cannot be empty
66 y 103 You do not have permission to access the resource you are requesting.
109 There was an error updating the balance.














