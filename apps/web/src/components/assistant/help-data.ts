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
        a: "1. Ve a Empresa en el menu lateral y completa los datos de tu empresa (nombre, CIF, direccion, logo).\n2. Configura tu tipo de entidad (autonomo o sociedad) en la seccion fiscal.\n3. Crea tus primeros clientes en CRM > Clientes.\n4. Ya puedes crear facturas y presupuestos.\n\nTodo lo demas (contabilidad, nominas, inventario) lo puedes activar a medida que lo necesites.",
      },
      {
        q: "Soy autonomo, que debo configurar?",
        a: "Ve a Empresa > Configuracion fiscal y selecciona:\n- Tipo de entidad: AUTONOMO\n- Regimen fiscal: Estimacion directa simplificada\n- Tipo IRPF: 15% (o 7% si eres nuevo autonomo)\n\nCon esto, al crear facturas se aplicara automaticamente la retencion de IRPF. Tambien tendras acceso al Modelo 130 en Contabilidad.",
      },
      {
        q: "Como personalizo mis facturas?",
        a: "En Empresa > Configuracion puedes:\n- Subir tu logo (aparecera en todas las facturas y presupuestos)\n- Elegir el color de las facturas\n- Configurar tus datos bancarios (IBAN/BIC) para que aparezcan en el PDF\n- Añadir un pie de pagina personalizado\n- Definir las condiciones de pago por defecto",
      },
      {
        q: "Puedo usar YouWhole desde el movil?",
        a: "Si. YouWhole es una PWA (Progressive Web App) instalable. En tu movil:\n- Abre la app en el navegador\n- Pulsa 'Añadir a pantalla de inicio'\n- Se instalara como una app nativa\n\nTendras acceso a todas las funciones con una interfaz adaptada al movil.",
      },
    ],
  },
  {
    id: "clientes",
    label: "CRM y Clientes",
    icon: "Users",
    questions: [
      {
        q: "Como creo un nuevo cliente?",
        a: "Ve a CRM > Clientes y pulsa 'Nuevo cliente'. Rellena como minimo:\n- Nombre o razon social\n- CIF/NIF (necesario para facturas)\n- Email (para enviar facturas por correo)\n\nTambien puedes añadir direccion, telefono, persona de contacto y notas.",
      },
      {
        q: "Que son los leads y el pipeline?",
        a: "Los leads son contactos potenciales que aun no son clientes. El pipeline es un tablero visual donde ves el estado de tus oportunidades de venta:\n\n- Lead: primer contacto\n- Cualificado: tiene interes real\n- Propuesta: le has enviado presupuesto\n- Negociacion: discutiendo condiciones\n- Ganado/Perdido: resultado final\n\nArrastra las tarjetas entre columnas para actualizar el estado.",
      },
      {
        q: "Como importo mis clientes existentes?",
        a: "Ve a Importacion en el menu lateral. Puedes subir un archivo Excel (.xlsx) con tus clientes. El archivo debe tener columnas como: nombre, email, telefono, cifNif, direccion, ciudad.\n\nEl sistema detectara las columnas automaticamente y te pedira confirmar antes de importar.",
      },
      {
        q: "Que es el portal del cliente?",
        a: "Cada cliente tiene un portal donde puede:\n- Ver sus facturas pendientes y pagadas\n- Descargar PDFs de facturas y presupuestos\n- Ver el estado de sus pedidos\n\nEl acceso se genera automaticamente con un enlace unico por cliente. Lo puedes enviar por email.",
      },
      {
        q: "Como funciona el sistema de tags/etiquetas?",
        a: "Puedes crear etiquetas de colores para clasificar clientes. Por ejemplo: 'VIP', 'Sector tecnologia', 'Pago lento'.\n\nVe a un cliente, y en su ficha podras asignar etiquetas existentes o crear nuevas. Luego puedes filtrar la lista de clientes por etiqueta.",
      },
    ],
  },
  {
    id: "facturacion",
    label: "Facturacion",
    icon: "FileText",
    questions: [
      {
        q: "Como creo una factura?",
        a: "Ve a Facturacion > Facturas > 'Nueva factura':\n1. Selecciona el cliente\n2. Añade las lineas (concepto, cantidad, precio)\n3. El IVA se aplica automaticamente segun tu configuracion\n4. Si eres autonomo, el IRPF se resta automaticamente\n5. Guarda como borrador o envia directamente\n\nEl numero de factura se genera automaticamente siguiendo la serie configurada.",
      },
      {
        q: "Como funciona el IRPF en las facturas?",
        a: "Si tu empresa esta configurada como AUTONOMO:\n- Al crear una factura, se añade automaticamente una linea de retencion IRPF (normalmente 15%)\n- El calculo es: Total = Base Imponible + IVA - IRPF\n- Ejemplo: Base 1000 EUR + IVA 21% (210 EUR) - IRPF 15% (150 EUR) = 1060 EUR\n\nLa retencion aparece en rojo tanto en la vista de factura como en el PDF.",
      },
      {
        q: "Como envio una factura por email?",
        a: "Desde la lista de facturas, pulsa los tres puntos (...) de la factura y selecciona 'Enviar por email'. La factura se enviara como PDF adjunto al email del cliente.\n\nEl estado cambiara automaticamente de 'Borrador' a 'Enviada'.",
      },
      {
        q: "Como duplico una factura?",
        a: "En la lista de facturas, pulsa los tres puntos (...) > 'Duplicar'. Se creara una copia como borrador con:\n- Los mismos productos y cantidades\n- Fecha actualizada al dia actual\n- Nuevo numero de factura\n\nPuedes modificar el cliente y los datos antes de enviarla.",
      },
      {
        q: "Puedo eliminar una factura?",
        a: "Depende del estado:\n- Borradores: se pueden eliminar siempre\n- Facturas canceladas sin registro VeriFactu: se pueden eliminar\n- Facturas enviadas/pagadas: NO se pueden eliminar (cumplimiento VeriFactu)\n\nSi necesitas anular una factura emitida, cambia su estado a 'Cancelada'. Esto genera el registro correspondiente sin borrar el rastro fiscal.",
      },
      {
        q: "Como funcionan las facturas recurrentes?",
        a: "Al crear una factura, activa la opcion 'Recurrente' y selecciona la frecuencia:\n- Semanal\n- Mensual\n- Trimestral\n- Anual\n\nEl sistema generara automaticamente una nueva factura cada periodo (se ejecuta diariamente a las 7:00 AM). Las facturas recurrentes se crean como borrador para que puedas revisarlas antes de enviar.",
      },
      {
        q: "Como uso los filtros avanzados de facturas?",
        a: "En la lista de facturas, pulsa el boton 'Filtros' para desplegar el panel:\n- Fecha desde/hasta: filtra por rango de fechas\n- Importe min/max: filtra por cantidad\n- Cliente: busca por nombre de cliente\n\nPuedes combinar todos los filtros. Pulsa 'Limpiar filtros' para resetear.",
      },
      {
        q: "Como uso las acciones masivas?",
        a: "En la tabla de facturas, marca las casillas de las facturas que quieras modificar. Aparecera una barra flotante en la parte inferior con opciones:\n- Marcar como pagadas\n- Marcar como enviadas\n- Cancelar seleccionadas\n\nUtil para actualizar multiples facturas de golpe.",
      },
      {
        q: "Como genero un link de pago Stripe?",
        a: "Si tienes Stripe configurado (STRIPE_SECRET_KEY en las variables de entorno), puedes generar un enlace de pago desde el menu de tres puntos de cada factura.\n\nEl cliente recibira un link seguro donde pagar con tarjeta. Cuando pague, la factura se marca automaticamente como pagada.",
      },
      {
        q: "Que son los presupuestos?",
        a: "Los presupuestos son propuestas que envias al cliente antes de facturar. Flujo:\n1. Creas un presupuesto con los productos/servicios\n2. Lo envias al cliente\n3. El cliente acepta o rechaza\n4. Si acepta, puedes convertirlo en factura con un clic\n\nLos presupuestos tienen fecha de validez. Si expira sin respuesta, se marca como 'Expirado'.",
      },
      {
        q: "Como funcionan los albaranes?",
        a: "Los albaranes (notas de entrega) documentan la entrega de productos/servicios:\n1. Crea el albaran con los productos entregados\n2. Envialo al cliente como comprobante de entrega\n3. Cuando quieras facturar, convierte el albaran en factura\n\nEstados: Borrador > Enviado > Entregado > Facturado.",
      },
      {
        q: "Puedo facturar en otro idioma?",
        a: "Si. Al crear o editar una factura, selecciona el idioma del documento. El PDF se generara con todas las etiquetas traducidas.\n\nIdiomas disponibles: Español, English, Francais, Deutsch, Portugues, Italiano, Catala.",
      },
      {
        q: "Puedo facturar en otra moneda?",
        a: "Si. Al crear una factura, selecciona la moneda deseada. El sistema muestra el tipo de cambio actual del BCE (Banco Central Europeo) y calcula el equivalente en EUR como referencia.\n\nMonedas disponibles: EUR, USD, GBP, CHF y muchas mas.",
      },
    ],
  },
  {
    id: "contabilidad",
    label: "Contabilidad",
    icon: "Calculator",
    questions: [
      {
        q: "Que informes contables tiene YouWhole?",
        a: "En Contabilidad tienes 8 secciones:\n\n1. Perdidas y Ganancias: ingresos vs gastos con grafico mensual\n2. IVA Trimestral: resumen para el Modelo 303\n3. Libro Diario: asientos contables manuales y automaticos\n4. Plan de Cuentas: cuentas PGC configurables\n5. Libro de Facturas: facturas emitidas y recibidas (formato AEAT)\n6. Modelo 130: pago fraccionado IRPF para autonomos\n7. Modelo 347: operaciones con terceros > 3.005,06 EUR\n8. Retenciones IRPF: resumen de retenciones por cliente",
      },
      {
        q: "Como funciona el Modelo 130?",
        a: "El Modelo 130 es el pago fraccionado de IRPF que los autonomos presentan trimestralmente. En YouWhole se calcula automaticamente:\n\nPor cada trimestre (Q1-Q4) muestra:\n- Ingresos del periodo\n- Gastos deducibles\n- Rendimiento neto (ingresos - gastos)\n- IRPF aplicable (20% del rendimiento)\n- Pagos anteriores acumulados\n- Cantidad a ingresar\n\nUsa estos datos como referencia para rellenar el modelo oficial en la AEAT.",
      },
      {
        q: "Que es el Modelo 347?",
        a: "El Modelo 347 es la declaracion anual de operaciones con terceros. Debes declarar cualquier cliente o proveedor con el que hayas realizado operaciones por mas de 3.005,06 EUR en el año.\n\nYouWhole calcula automaticamente que clientes y proveedores superan este umbral y muestra el total de operaciones con cada uno.",
      },
      {
        q: "Como registro un asiento contable manual?",
        a: "En Contabilidad > Libro Diario, pulsa 'Asiento':\n1. Selecciona la fecha\n2. Escribe la descripcion\n3. Añade minimo 2 lineas con las cuentas contables\n4. Cada linea tiene Debe y Haber\n5. El asiento debe cuadrar (total Debe = total Haber)\n\nEl sistema no te dejara guardar si no cuadra.",
      },
      {
        q: "Como funciona la conciliacion bancaria?",
        a: "En Banco puedes importar extractos bancarios (CSV/Excel). El sistema:\n1. Lee las transacciones del archivo\n2. Intenta emparejar cada transaccion con facturas pendientes\n3. Las transacciones conciliadas se marcan automaticamente\n4. Las no conciliadas quedan pendientes para revision manual",
      },
    ],
  },
  {
    id: "productos",
    label: "Productos e Inventario",
    icon: "Package",
    questions: [
      {
        q: "Como creo un producto o servicio?",
        a: "Ve a Facturacion > Productos > 'Nuevo producto':\n- Nombre y descripcion\n- Tipo: Servicio, Digital o Fisico\n- Precio de venta\n- Coste (opcional, para calcular margenes)\n- Impuesto asociado (IVA)\n- SKU o codigo de barras (opcional)\n\nLos productos aparecen en el selector al crear facturas y presupuestos.",
      },
      {
        q: "Como funciona el control de stock?",
        a: "Para productos fisicos, activa 'Controlar stock' en la ficha del producto:\n- Define el stock actual y el stock minimo\n- Cada venta (factura) descuenta automaticamente\n- Cada compra (pedido de compra) suma automaticamente\n- Puedes hacer ajustes manuales desde Inventario\n\nSi el stock baja del minimo, el sistema te avisa.",
      },
      {
        q: "Como gestiono proveedores y compras?",
        a: "En Contabilidad > Proveedores gestionas tus proveedores. Desde Compras puedes crear pedidos de compra:\n1. Selecciona el proveedor\n2. Añade los productos que necesitas\n3. Envia el pedido\n4. Cuando recibes la mercancia, marca como recibido\n\nEl stock se actualiza automaticamente al marcar como recibido.",
      },
    ],
  },
  {
    id: "rrhh",
    label: "RRHH y Nominas",
    icon: "UserCheck",
    questions: [
      {
        q: "Como doy de alta un empleado?",
        a: "Ve a CRM > Empleados > 'Nuevo empleado'. Datos necesarios:\n- Nombre y apellidos\n- NIF y Numero de Seguridad Social\n- Tipo de contrato (indefinido, temporal, practicas, autonomo)\n- Fecha de inicio\n- Salario bruto\n- Cuenta bancaria para nominas\n- Horario semanal\n\nEl empleado aparecera en el sistema para registrar horas y generar nominas.",
      },
      {
        q: "Como genero una nomina?",
        a: "Ve a CRM > Nominas. Para cada empleado y mes:\n1. Se calcula automaticamente a partir del salario bruto\n2. Se aplican las retenciones de IRPF y Seguridad Social\n3. Puedes añadir horas extra y bonificaciones\n4. El sistema calcula: Bruto - SS empleado - IRPF = Neto\n5. Aprueba y marca como pagada cuando realices la transferencia",
      },
      {
        q: "Como funciona el control horario?",
        a: "En Control horario puedes registrar las horas de los empleados:\n- Fecha, hora de entrada, hora de salida, minutos de descanso\n- Opcionalmente, asociar las horas a un proyecto\n- El sistema calcula automaticamente las horas totales\n\nPuedes filtrar por empleado, proyecto y rango de fechas. Los resúmenes muestran horas de hoy, esta semana y este mes.",
      },
      {
        q: "Como gestiono vacaciones y ausencias?",
        a: "Cada empleado puede solicitar permisos:\n- Vacaciones\n- Baja medica\n- Asuntos personales\n- Maternidad/Paternidad\n\nLas solicitudes quedan como 'Pendiente' hasta que un administrador las apruebe o rechace. El calendario muestra visualmente los dias de ausencia.",
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
        a: "Ve a Proyectos > 'Nuevo proyecto':\n- Nombre del proyecto\n- Cliente asociado (opcional)\n- Presupuesto estimado\n- Tarifa por hora (para calcular rentabilidad)\n- Fechas de inicio y fin\n- Color identificativo\n\nLos proyectos se muestran como tarjetas con una barra de progreso del presupuesto.",
      },
      {
        q: "Como veo la rentabilidad de un proyecto?",
        a: "Haz clic en un proyecto para ver su detalle. Los KPIs muestran:\n- Ingresos: total facturado y cobrado vinculado al proyecto\n- Horas: total de horas registradas por los empleados\n- Presupuesto usado: porcentaje del presupuesto consumido\n- Margen: (Ingresos - Coste estimado) / Ingresos\n\nEl coste estimado se calcula multiplicando las horas registradas por la tarifa/hora del proyecto.",
      },
      {
        q: "Como vinculo facturas a un proyecto?",
        a: "Al crear una factura, puedes seleccionar el proyecto al que pertenece. Esto permite:\n- Ver todas las facturas del proyecto en su pagina de detalle\n- Calcular los ingresos reales del proyecto\n- Comparar lo facturado vs lo presupuestado",
      },
      {
        q: "Como registro horas en un proyecto?",
        a: "Desde Control horario, al crear una entrada de tiempo puedes seleccionar el proyecto. Las horas registradas:\n- Aparecen en el detalle del proyecto\n- Se usan para calcular el coste estimado (horas x tarifa/hora)\n- Permiten analizar la rentabilidad real del proyecto",
      },
    ],
  },
  {
    id: "sistema",
    label: "Configuracion y Sistema",
    icon: "Settings",
    questions: [
      {
        q: "Como configuro mis datos de empresa?",
        a: "Ve a Empresa en el menu lateral:\n- Datos generales: nombre, CIF, direccion, telefono\n- Logo: sube tu logotipo (aparece en facturas y presupuestos)\n- Datos bancarios: IBAN y BIC para mostrar en facturas\n- Configuracion fiscal: tipo de entidad, regimen fiscal, IRPF\n- Color de facturas: personaliza el color de la barra superior del PDF\n- Condiciones de pago: texto que aparece al pie de las facturas",
      },
      {
        q: "Que son los campos personalizados?",
        a: "Los campos personalizados te permiten añadir informacion extra a tus entidades. Por ejemplo:\n- Clientes: 'Sector', 'Codigo interno', 'Fecha de alta'\n- Facturas: 'Numero de pedido', 'Centro de coste'\n- Productos: 'Marca', 'Temporada'\n\nVe a Campos personalizados en el menu. Puedes crear campos de tipo texto, numero, fecha, seleccion o si/no.",
      },
      {
        q: "Como configuro las automatizaciones?",
        a: "En Automatizaciones puedes crear reglas que se ejecutan automaticamente:\n- Disparador: cuando pasa algo (factura creada, factura pagada, lead nuevo...)\n- Accion: que hacer (enviar email, crear notificacion, enviar webhook)\n\nEjemplo: 'Cuando una factura se marca como pagada, enviar email de agradecimiento al cliente'.",
      },
      {
        q: "Como funcionan los webhooks?",
        a: "Los webhooks envian una notificacion HTTP a una URL externa cuando ocurre un evento. Util para integrar con otros sistemas.\n\nEventos disponibles: factura creada, factura pagada, cliente creado, presupuesto aceptado, pago recibido.\n\nVe a Webhooks y configura la URL de destino y los eventos que quieres monitorizar.",
      },
      {
        q: "Como exporto mis datos?",
        a: "Tienes dos opciones:\n\n1. Export Excel: en las listas de clientes, facturas, productos y proveedores hay un boton 'Excel' que descarga los datos filtrados.\n\n2. Backup completo: en Backup puedes descargar TODOS los datos de tu empresa en formato JSON. Incluye clientes, facturas, presupuestos, productos, empleados, asientos contables y mas.",
      },
      {
        q: "Que es el registro de auditoria?",
        a: "En Auditoria puedes ver un historial de todas las acciones realizadas en el sistema:\n- Quien hizo que y cuando\n- Que datos se cambiaron (antes/despues)\n- Filtrable por entidad (facturas, clientes...) y tipo de accion (crear, editar, eliminar)\n\nUtil para control interno y trazabilidad.",
      },
      {
        q: "Que es VeriFactu?",
        a: "VeriFactu es el sistema de la AEAT para verificar facturas electronicas. YouWhole genera automaticamente:\n- Hash encadenado de cada factura\n- Codigo QR de verificacion\n- Registro XML firmado\n\nEn Facturacion > VeriFactu puedes ver el estado de cada registro y su historial de envios a la AEAT.",
      },
      {
        q: "Como gestiono los planes y la suscripcion?",
        a: "En Billing puedes:\n- Ver tu plan actual (Free, Starter, Pro, Enterprise)\n- Cambiar de plan\n- Gestionar tu suscripcion de Stripe\n- Ver las facturas de YouWhole\n\nCada plan tiene diferentes limites de facturas, clientes y funcionalidades.",
      },
    ],
  },
];
