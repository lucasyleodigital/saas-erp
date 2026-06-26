export interface HelpQuestion {
  q: string;
  a: string;
}

export interface HelpCategory {
  id: string;
  label: string;
  icon: string;
  questions: HelpQuestion[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "inicio",
    label: "Primeros pasos",
    icon: "Rocket",
    questions: [
      {
        q: "Como empiezo a usar YouWhole?",
        a: "1. Ve a Mi Empresa en el menu lateral y completa los datos de tu empresa (nombre, CIF, direccion, logo).\n2. Configura tu tipo de entidad (autonomo o sociedad) en la seccion fiscal.\n3. Crea tus primeros clientes en CRM > Clientes.\n4. Crea tu primera factura en Facturacion > Facturas.\n\nTodo lo demas (contabilidad, nominas, inventario) lo puedes activar a medida que lo necesites.",
      },
      {
        q: "Soy autonomo, que debo configurar?",
        a: "Ve a Mi Empresa > seccion Configuracion fiscal:\n- Tipo de entidad: AUTONOMO\n- Regimen fiscal: Estimacion directa simplificada\n- Tipo IRPF: 15% (o 7% si eres nuevo autonomo en los primeros 2 anos)\n- Activa 'Aplicar IRPF automaticamente'\n\nCon esto, al crear facturas se aplicara la retencion IRPF automaticamente. Tambien tendras acceso al Modelo 130 en Contabilidad.",
      },
      {
        q: "Como personalizo mis facturas?",
        a: "En Mi Empresa puedes:\n- Subir tu logo (aparecera en facturas y presupuestos)\n- Elegir el color de las facturas en Apariencia\n- Configurar datos bancarios (IBAN/BIC) para que aparezcan en el PDF\n- Anadir pie de pagina personalizado\n- Definir condiciones de pago por defecto",
      },
      {
        q: "Como cambio el idioma de la app?",
        a: "Haz clic en el icono del globo (ES) arriba a la derecha del header. Puedes elegir entre castellano, catalan, euskera, gallego e ingles. El idioma cambia toda la interfaz de la app.\n\nPara el idioma de las facturas PDF, se selecciona al crear cada factura individualmente en el campo 'Idioma del documento'.",
      },
      {
        q: "Como invito a mi equipo?",
        a: "Ve a Mi Empresa y baja hasta la seccion Equipo. Ahi puedes:\n1. Introducir el email del nuevo miembro\n2. Seleccionar su rol (Admin, Editor o Viewer)\n3. Pulsar Invitar\n\nLe llegara un email con un enlace para unirse. Cada plan tiene un limite de usuarios.",
      },
    ],
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: "Users",
    questions: [
      {
        q: "Como creo un nuevo cliente?",
        a: "1. Ve a CRM > Clientes en el menu lateral.\n2. Pulsa el boton '+ Nuevo cliente' arriba a la derecha.\n3. Rellena los datos: nombre, tipo de cliente (Empresa, Autonomo o Particular), CIF/NIF, email, telefono, direccion.\n4. Pulsa 'Crear cliente'.\n\nEl tipo de cliente es importante: si es Particular, no se le aplicara IRPF en las facturas.",
      },
      {
        q: "Como edito un cliente existente?",
        a: "1. Ve a CRM > Clientes.\n2. Busca el cliente en la lista o usa el buscador.\n3. Haz clic en los 3 puntos (...) a la derecha del cliente.\n4. Selecciona 'Editar'.\n5. Modifica los datos que necesites y pulsa 'Guardar cambios'.",
      },
      {
        q: "Como elimino un cliente?",
        a: "1. Ve a CRM > Clientes.\n2. Haz clic en los 3 puntos (...) del cliente.\n3. Selecciona 'Eliminar'.\n4. Confirma la eliminacion.\n\nNota: si el cliente tiene facturas asociadas, no se podra eliminar. Primero tendrias que eliminar o reasignar las facturas.",
      },
      {
        q: "Como exporto mis clientes a Excel?",
        a: "1. Ve a CRM > Clientes.\n2. Pulsa el boton 'Exportar' arriba a la derecha.\n3. Se descargara un archivo Excel con todos tus clientes y sus datos.",
      },
      {
        q: "Que es el portal del cliente?",
        a: "El portal del cliente es un enlace unico que puedes enviar a tu cliente para que vea sus facturas y presupuestos sin necesidad de tener cuenta en YouWhole.\n\nPara generar el enlace: haz clic en los 3 puntos del cliente > 'Copiar enlace del portal'. Puedes enviarselo por email o WhatsApp.",
      },
      {
        q: "Que significa Facturado y Pendiente?",
        a: "- Facturado: suma total de todas las facturas emitidas a ese cliente (no borrador ni canceladas).\n- Pendiente: suma de facturas que aun no se han cobrado (enviadas, parciales o vencidas).\n\nEstos valores se actualizan automaticamente al crear facturas o registrar pagos.",
      },
    ],
  },
  {
    id: "leads",
    label: "Leads",
    icon: "UserPlus",
    questions: [
      {
        q: "Que es un lead?",
        a: "Un lead es un contacto potencial que aun no es tu cliente. Puede ser alguien que te ha pedido informacion, un contacto de una feria, o un formulario de tu web.\n\nEl flujo es: Lead > Convertir a cliente > Facturar.",
      },
      {
        q: "Como creo un lead?",
        a: "1. Ve a CRM > Leads.\n2. Pulsa '+ Nuevo lead'.\n3. Rellena nombre, email, telefono, empresa y origen (web, recomendacion, feria, etc.).\n4. Pulsa 'Crear'.",
      },
      {
        q: "Como convierto un lead en cliente?",
        a: "1. Ve a CRM > Leads.\n2. Busca el lead en la lista.\n3. Haz clic en los 3 puntos (...) a la derecha.\n4. Selecciona 'Convertir a cliente'.\n\nSe creara automaticamente un cliente con todos los datos del lead (nombre, email, telefono). El lead quedara marcado como convertido.",
      },
    ],
  },
  {
    id: "pipeline",
    label: "Pipeline de ventas",
    icon: "BarChart3",
    questions: [
      {
        q: "Que es el pipeline?",
        a: "El pipeline es un tablero visual tipo Kanban donde gestionas tus oportunidades de venta. Cada columna es una etapa (Lead, Cualificado, Propuesta, Negociacion, Ganado, Perdido).\n\nArrastra las tarjetas entre columnas para mover las oportunidades de etapa.",
      },
      {
        q: "Como creo una oportunidad?",
        a: "1. Ve a CRM > Pipeline.\n2. Pulsa '+ Nuevo lead' o haz clic en el '+' de cualquier columna.\n3. Rellena titulo, cliente, valor estimado y fecha de cierre.\n4. La oportunidad aparecera en la columna que hayas seleccionado.",
      },
      {
        q: "Como muevo una oportunidad de etapa?",
        a: "Arrastra la tarjeta de la oportunidad y sueltala en la columna de la nueva etapa. El cambio se guarda automaticamente.",
      },
    ],
  },
  {
    id: "facturas",
    label: "Facturas",
    icon: "FileText",
    questions: [
      {
        q: "Como creo una factura?",
        a: "1. Ve a Facturacion > Facturas.\n2. Pulsa '+ Nueva factura'.\n3. Selecciona el cliente, fechas de emision y vencimiento.\n4. Elige moneda, idioma del PDF y proyecto (opcional).\n5. Anade lineas con descripcion, cantidad y precio.\n6. Si eres autonomo, activa/desactiva el IRPF y ajusta el porcentaje.\n7. Pulsa 'Crear factura'.\n\nLa factura se crea como borrador. Puedes enviarla al cliente desde el menu de acciones.",
      },
      {
        q: "Como envio una factura al cliente?",
        a: "1. Ve a Facturas y busca la factura.\n2. Haz clic en los 3 puntos (...).\n3. Selecciona 'Enviar por email'.\n\nEl cliente recibira un email con el PDF adjunto y un enlace para ver/pagar la factura online.",
      },
      {
        q: "Como registro un pago?",
        a: "1. Haz clic en la factura para ver el detalle.\n2. Pulsa 'Registrar pago'.\n3. Introduce el importe y metodo de pago.\n\nSi el pago cubre el total, la factura pasa a 'Pagada'. Si es parcial, pasa a 'Pago parcial'.",
      },
      {
        q: "Como duplico una factura?",
        a: "En los 3 puntos de la factura, selecciona 'Duplicar'. Se crea una copia como borrador con la fecha de hoy. Util para facturas recurrentes manuales.",
      },
      {
        q: "Como descargo el PDF?",
        a: "En los 3 puntos de la factura, selecciona 'Descargar PDF'. El PDF incluye todos los datos, IVA, IRPF (si aplica), datos bancarios y QR de VeriFactu.",
      },
      {
        q: "Que es el IRPF en las facturas?",
        a: "Si eres autonomo, tus facturas a empresas deben incluir una retencion de IRPF (normalmente 15%, o 7% si eres nuevo autonomo).\n\nConfiguralo en Mi Empresa > Configuracion fiscal. Al crear facturas, aparecera un toggle para activar/desactivar el IRPF y ajustar el porcentaje.\n\nA particulares no se aplica IRPF.",
      },
      {
        q: "Como facturo en otra moneda o idioma?",
        a: "Al crear una factura, tienes dos selectores:\n- Moneda: 20+ divisas con tipo de cambio del BCE en tiempo real.\n- Idioma del documento: castellano, catalan, euskera, gallego o ingles.\n\nEl PDF se generara con las etiquetas en el idioma seleccionado y los importes en la moneda elegida.",
      },
    ],
  },
  {
    id: "presupuestos",
    label: "Presupuestos",
    icon: "ClipboardList",
    questions: [
      {
        q: "Como creo un presupuesto?",
        a: "1. Ve a Facturacion > Presupuestos.\n2. Pulsa '+ Nuevo presupuesto'.\n3. Selecciona cliente, fechas y anade las lineas.\n4. Pulsa 'Crear presupuesto'.\n\nEl presupuesto se crea como borrador.",
      },
      {
        q: "Como convierto un presupuesto en factura?",
        a: "1. Busca el presupuesto aceptado.\n2. Haz clic en los 3 puntos (...).\n3. Selecciona 'Convertir a factura'.\n\nSe creara una factura con todos los datos del presupuesto. Si eres autonomo, se aplicara IRPF automaticamente.",
      },
      {
        q: "Como envio un presupuesto?",
        a: "En los 3 puntos del presupuesto, selecciona 'Enviar por email'. El cliente recibira un PDF con los detalles y podra aceptar o rechazar desde el portal.",
      },
    ],
  },
  {
    id: "pedidos",
    label: "Pedidos de clientes",
    icon: "ShoppingCart",
    questions: [
      {
        q: "Que son los pedidos?",
        a: "Los pedidos son solicitudes de compra que te hacen tus clientes. Es el paso entre el presupuesto aceptado y el albaran/factura.\n\nFlujo: Presupuesto > Pedido > Albaran > Factura.",
      },
      {
        q: "Como creo un pedido?",
        a: "1. Ve a Facturacion > Pedidos.\n2. Pulsa '+ Nuevo pedido'.\n3. Selecciona el cliente y anade los productos/servicios.\n4. Pulsa crear.",
      },
    ],
  },
  {
    id: "albaranes",
    label: "Albaranes",
    icon: "Truck",
    questions: [
      {
        q: "Que es un albaran?",
        a: "Un albaran es un documento de entrega que confirma que has enviado o entregado productos/servicios a un cliente. No tiene valor fiscal, pero sirve como prueba de entrega.",
      },
      {
        q: "Como creo un albaran?",
        a: "1. Ve a Facturacion > Albaranes.\n2. Pulsa '+ Nuevo albaran'.\n3. Selecciona el cliente, fecha de entrega y anade las lineas.\n4. Pulsa crear.",
      },
      {
        q: "Como convierto un albaran en factura?",
        a: "En el detalle del albaran, pulsa el boton 'Facturar'. Se creara automaticamente una factura con los datos del albaran.",
      },
    ],
  },
  {
    id: "productos",
    label: "Productos y servicios",
    icon: "Package",
    questions: [
      {
        q: "Como creo un producto?",
        a: "1. Ve a Facturacion > Productos.\n2. Pulsa '+ Nuevo producto'.\n3. Rellena nombre, descripcion, precio, referencia/SKU y categoria.\n4. Pulsa crear.\n\nLos productos aparecen como opciones al crear facturas y presupuestos, rellenando automaticamente la descripcion y el precio.",
      },
      {
        q: "Cual es la diferencia entre producto y servicio?",
        a: "Al crear un producto puedes seleccionar el tipo:\n- Producto: bien fisico con stock (se gestiona en Inventario).\n- Servicio: no tiene stock (horas de consultoria, diseno, etc.).",
      },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icon: "Calculator",
    questions: [
      {
        q: "Que informes tiene la contabilidad?",
        a: "YouWhole incluye 7 secciones contables:\n\n1. Perdidas y Ganancias: ingresos vs gastos con grafico mensual.\n2. IVA Trimestral (Modelo 303): IVA a declarar por trimestre.\n3. Libro Diario: asientos contables manuales.\n4. Plan de Cuentas: plan PGC espanol completo.\n5. Libro de Facturas: listado de facturas emitidas y recibidas.\n6. Modelo 130: pago fraccionado IRPF (solo autonomos).\n7. Modelo 347: operaciones con terceros > 3.005 EUR.\n8. Retenciones IRPF: resumen de retenciones aplicadas.",
      },
      {
        q: "Como funciona el IVA trimestral?",
        a: "El IVA trimestral se calcula automaticamente a partir de tus facturas:\n- Base imponible: suma de subtotales de facturas del trimestre.\n- IVA repercutido: 21% sobre la base.\n\nLos datos se agrupan por trimestres (T1 Ene-Mar, T2 Abr-Jun, T3 Jul-Sep, T4 Oct-Dic).\n\nSi el IVA sale a 0 pero tienes facturas, pulsa el boton 'Reparar impuestos' para recalcular.",
      },
      {
        q: "Como creo un asiento contable?",
        a: "1. Ve a Contabilidad > pestana Libro Diario.\n2. Pulsa '+ Asiento'.\n3. Introduce fecha, descripcion.\n4. Anade lineas con cuenta, debe y haber.\n5. El asiento debe cuadrar (debe = haber).\n6. Pulsa 'Crear asiento'.",
      },
      {
        q: "Que es el Modelo 130?",
        a: "El Modelo 130 es el pago fraccionado de IRPF que los autonomos presentan trimestralmente.\n\nCalcula: 20% de (ingresos - gastos) del trimestre, menos retenciones ya practicadas y pagos de trimestres anteriores.\n\nSe presenta entre el 1 y el 20 del mes siguiente al fin de trimestre (abril, julio, octubre, enero).",
      },
      {
        q: "Para que sirve el Plan de Cuentas?",
        a: "El Plan de Cuentas es la estructura contable PGC (Plan General Contable) espanol. Organiza todas las cuentas por grupos:\n\n- Grupo 1-2: Financiacion e inmovilizado\n- Grupo 3: Existencias\n- Grupo 4: Acreedores y deudores (clientes, proveedores, Hacienda)\n- Grupo 5: Cuentas financieras (bancos, caja)\n- Grupo 6: Compras y gastos\n- Grupo 7: Ventas e ingresos\n\nSe crea automaticamente y puedes anadir o eliminar cuentas segun necesites.",
      },
    ],
  },
  {
    id: "banco",
    label: "Banco",
    icon: "Landmark",
    questions: [
      {
        q: "Como importo un extracto bancario?",
        a: "1. Ve a Contabilidad > Banco.\n2. Crea una cuenta bancaria si no tienes ninguna (nombre + IBAN).\n3. Pulsa 'Importar extracto' en la cuenta.\n4. Selecciona tu archivo CSV o Excel del banco.\n5. El sistema detecta automaticamente las columnas (fecha, concepto, importe).\n\nFunciona con extractos de CaixaBank, BBVA, Santander, ING, Bankinter, Sabadell y la mayoria de bancos espanoles.",
      },
      {
        q: "Como veo los movimientos importados?",
        a: "En la tarjeta de tu cuenta bancaria, pulsa 'Movimientos'. Se despliega la lista de transacciones con:\n- Fecha y concepto\n- Importe (verde = ingreso, rojo = gasto)\n- Estado: Conciliado o Pendiente",
      },
      {
        q: "Que es la conciliacion bancaria?",
        a: "La conciliacion cruza los movimientos del banco con tus facturas:\n- Si un ingreso coincide con el importe de una factura pendiente, se marca como 'Conciliado' y la factura pasa a 'Pagada'.\n- Los que no coinciden quedan como 'Pendiente' para revision manual.",
      },
      {
        q: "Como elimino movimientos?",
        a: "Puedes eliminar movimientos uno a uno con el icono de papelera de cada fila, o pulsar 'Limpiar todo' para eliminar todos los movimientos de una cuenta.",
      },
    ],
  },
  {
    id: "compras",
    label: "Compras a proveedores",
    icon: "PackageCheck",
    questions: [
      {
        q: "Como hago un pedido a un proveedor?",
        a: "1. Ve a Contabilidad > Ordenes de compra.\n2. Pulsa '+ Nueva orden'.\n3. Selecciona el proveedor, fecha y anade los productos que necesitas.\n4. Pulsa crear.\n\nCuando recibas la mercancia, marca la orden como 'Recibida' para actualizar el inventario.",
      },
      {
        q: "Como creo un proveedor?",
        a: "1. Ve a Contabilidad > Proveedores.\n2. Pulsa '+ Nuevo proveedor'.\n3. Rellena nombre, CIF/NIF, email, telefono y direccion.\n4. Pulsa crear.\n\nLos proveedores aparecen como opcion al crear ordenes de compra.",
      },
    ],
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: "Warehouse",
    questions: [
      {
        q: "Como gestiono mi stock?",
        a: "Ve a Contabilidad > Inventario. Tienes 5 pestanas:\n\n1. Stock: niveles actuales por producto y almacen.\n2. Alertas: productos por debajo del stock minimo.\n3. Movimientos: historial de entradas y salidas.\n4. Valoracion: valor total del inventario.\n5. Almacenes: gestion de diferentes ubicaciones.",
      },
      {
        q: "Como creo un almacen?",
        a: "1. Ve a Inventario > pestana Almacenes.\n2. Pulsa '+ Nuevo almacen'.\n3. Introduce nombre, descripcion y direccion.\n4. Pulsa crear.\n\nPuedes tener multiples almacenes y transferir stock entre ellos.",
      },
      {
        q: "Como registro una entrada de stock?",
        a: "1. Ve a Inventario > pestana Stock.\n2. Busca el producto.\n3. Haz clic en los 3 puntos > 'Registrar movimiento'.\n4. Selecciona tipo (Entrada), cantidad y almacen.\n5. Pulsa guardar.",
      },
      {
        q: "Como configuro alertas de stock minimo?",
        a: "1. Busca el producto en Stock.\n2. Haz clic en los 3 puntos > 'Configurar stock minimo'.\n3. Introduce la cantidad minima.\n\nCuando el stock baje de ese nivel, aparecera en la pestana Alertas.",
      },
    ],
  },
  {
    id: "empleados",
    label: "Empleados y RRHH",
    icon: "UserCheck",
    questions: [
      {
        q: "Como anado un empleado?",
        a: "1. Ve a CRM > Empleados.\n2. Pulsa '+ Nuevo empleado'.\n3. Rellena datos personales (nombre, email, NIF, numero SS), puesto, departamento, tipo de contrato y salario.\n4. Pulsa crear.",
      },
      {
        q: "Como gestiono las nominas?",
        a: "1. Ve a Nominas en el menu lateral.\n2. Selecciona mes y ano.\n3. Pulsa 'Generar nominas' para crear las nominas del periodo.\n4. Revisa cada nomina (bruto, SS, IRPF, neto).\n5. Aprueba y marca como pagadas.\n\nPuedes descargar el SEPA XML para enviar los pagos al banco.",
      },
      {
        q: "Como registro las horas de un empleado?",
        a: "1. Ve a Control horario.\n2. Selecciona el empleado.\n3. Pulsa 'Fichar entrada' cuando empiece y 'Fichar salida' cuando termine.\n\nTambien puedes registrar horas manualmente indicando fecha, hora de entrada y salida.",
      },
    ],
  },
  {
    id: "proyectos",
    label: "Proyectos",
    icon: "FolderKanban",
    questions: [
      {
        q: "Como creo un proyecto?",
        a: "1. Ve a CRM > Proyectos.\n2. Pulsa '+ Nuevo proyecto'.\n3. Rellena nombre, cliente, presupuesto, tarifa por hora y descripcion.\n4. Pulsa crear.\n\nPuedes vincular facturas y horas a cada proyecto para ver su rentabilidad.",
      },
      {
        q: "Como veo la rentabilidad de un proyecto?",
        a: "Haz clic en el proyecto para ver su detalle. Veras 4 KPIs:\n- Ingresos: facturas vinculadas al proyecto.\n- Horas: total de horas registradas.\n- Presupuesto usado: porcentaje gastado.\n- Margen: rentabilidad real.",
      },
    ],
  },
  {
    id: "verifactu",
    label: "VeriFactu",
    icon: "Shield",
    questions: [
      {
        q: "Que es VeriFactu?",
        a: "VeriFactu es el sistema de verificacion de facturas de la Agencia Tributaria (AEAT). Desde 2025, todo software de facturacion debe cumplir con VeriFactu.\n\nYouWhole lo incluye de serie: cada factura genera un hash SHA256 en cadena, un registro inmutable y un codigo QR verificable.",
      },
      {
        q: "Como funciona automaticamente?",
        a: "1. Creas una factura normalmente.\n2. Al enviarla o marcarla como pagada, se genera el registro VeriFactu automaticamente.\n3. El PDF incluye un codigo QR que cualquiera puede verificar en la AEAT.\n\nNo necesitas hacer nada extra - el cumplimiento es automatico.",
      },
      {
        q: "Donde veo los registros VeriFactu?",
        a: "Ve a Facturacion > VeriFactu. Ahi ves todos los registros con su estado (Generado, Enviado, Aceptado) y puedes verificarlos en la AEAT.",
      },
    ],
  },
  {
    id: "automatizaciones",
    label: "Automatizaciones",
    icon: "Zap",
    questions: [
      {
        q: "Que puedo automatizar?",
        a: "Puedes crear reglas que se ejecutan automaticamente cuando pasa algo:\n\n- Factura creada > enviar email al cliente\n- Factura vencida > enviar recordatorio de cobro\n- Nuevo lead > notificacion interna\n- Pago recibido > enviar confirmacion\n- Stock bajo > alerta\n- Presupuesto aceptado > webhook a Zapier/Make",
      },
      {
        q: "Como creo una automatizacion?",
        a: "1. Ve a Sistema > Automatizaciones.\n2. Pulsa '+ Nueva automatizacion' o usa una plantilla predefinida.\n3. Selecciona el disparador (cuando pasa X).\n4. Selecciona la accion (hacer Y): enviar email, crear notificacion o enviar webhook.\n5. Configura los detalles y activa la automatizacion.",
      },
    ],
  },
  {
    id: "config",
    label: "Configuracion",
    icon: "Settings",
    questions: [
      {
        q: "Como cambio mi contrasena?",
        a: "1. Ve a Sistema > Configuracion.\n2. Pestana 'Seguridad'.\n3. Introduce tu contrasena actual y la nueva (minimo 8 caracteres).\n4. Pulsa 'Cambiar contrasena'.",
      },
      {
        q: "Como configuro las notificaciones?",
        a: "Ve a Sistema > Configuracion > pestana 'Notificaciones'. Puedes activar/desactivar alertas de facturas vencidas, nuevos leads, pagos recibidos y resumen semanal.",
      },
      {
        q: "Como hago un backup de mis datos?",
        a: "Ve a Sistema > Backup. Puedes descargar todos tus datos (clientes, facturas, productos, contabilidad) en un archivo que puedes guardar como copia de seguridad.",
      },
      {
        q: "Que es la auditoria?",
        a: "El registro de auditoria muestra quien hizo que y cuando en tu empresa. Registra creaciones, modificaciones y eliminaciones de facturas, clientes y otros datos.\n\nUtil para:\n- Saber quien modifico una factura\n- Demostrar a Hacienda cuando se emitio un documento\n- Controlar la actividad del equipo",
      },
    ],
  },
];
