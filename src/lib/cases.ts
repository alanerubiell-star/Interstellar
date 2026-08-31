import type { ClinicalNote, TranscriptLine } from './types'

export interface CaseScript {
  id: string
  motivo: string
  claves: string[]              // palabras que activan este caso
  transcript: TranscriptLine[]
  note: ClinicalNote
}

/**
 * Guiones de consulta usados por el motor de demostración: la transcripción se
 * reproduce en tiempo real durante la grabación y la nota es lo que el motor
 * "genera" al terminar. Sustituir por la API de transcripción + LLM en producción.
 */
export const CASES: CaseScript[] = [
  {
    id: 'faringoamigdalitis',
    motivo: 'Dolor de garganta y fiebre',
    claves: ['garganta', 'fiebre', 'faringitis', 'amigdalas', 'amígdalas', 'dolor al tragar'],
    transcript: [
      { t: 2,  hablante: 'medico',   texto: 'Buenas tardes, ¿en qué le puedo ayudar hoy?' },
      { t: 6,  hablante: 'paciente', texto: 'Doctor, tengo tres días con mucho dolor de garganta y me subió la fiebre anoche.' },
      { t: 13, hablante: 'medico',   texto: '¿Midió la temperatura?' },
      { t: 16, hablante: 'paciente', texto: 'Sí, 38.6 grados. Tomé paracetamol y bajó un rato.' },
      { t: 23, hablante: 'medico',   texto: '¿Tiene tos, escurrimiento nasal o le duelen los oídos?' },
      { t: 28, hablante: 'paciente', texto: 'Tos casi no. Nada de gripa. Me cuesta mucho pasar la comida.' },
      { t: 36, hablante: 'medico',   texto: '¿Alguien más en casa con lo mismo?' },
      { t: 40, hablante: 'paciente', texto: 'Mi hijo estuvo con anginas la semana pasada.' },
      { t: 46, hablante: 'medico',   texto: 'Voy a revisarle la garganta. Abra la boca, diga aaah.' },
      { t: 54, hablante: 'medico',   texto: 'Tiene las amígdalas muy inflamadas, con placas blancas en ambos lados, y ganglios crecidos en el cuello. No hay tos.' },
      { t: 66, hablante: 'medico',   texto: 'Presión 118 sobre 76, pulso 92, temperatura 38.4, saturación 98.' },
      { t: 75, hablante: 'medico',   texto: 'Esto es una faringoamigdalitis, muy probablemente bacteriana. Le voy a dar amoxicilina 500 miligramos cada 8 horas por 7 días.' },
      { t: 88, hablante: 'paciente', texto: '¿Soy alérgico a algo? No, a nada que yo sepa.' },
      { t: 94, hablante: 'medico',   texto: 'Perfecto. También paracetamol de 500 cada 8 horas si tiene fiebre o dolor, tomar mucha agua y gárgaras con agua tibia con sal.' },
      { t: 108, hablante: 'medico',  texto: 'Reposo dos días. Si en 48 horas no mejora, si no puede tragar líquidos o le cuesta respirar, regresa de inmediato.' },
      { t: 121, hablante: 'medico',  texto: 'La veo en una semana para control. ¿Alguna duda?' },
      { t: 127, hablante: 'paciente', texto: 'No doctor, muchas gracias.' },
    ],
    note: {
      motivo: 'Odinofagia y fiebre de 3 días de evolución',
      padecimientoActual:
        'Paciente refiere cuadro de 3 días de evolución caracterizado por odinofagia intensa y fiebre cuantificada de hasta 38.6 °C, con mejoría parcial tras paracetamol. Niega tos significativa y rinorrea. Refiere disfagia a sólidos. Antecedente de contacto intradomiciliario con cuadro faríngeo la semana previa (hijo). Niega alergias medicamentosas conocidas.',
      exploracionFisica:
        'Paciente consciente, orientado, hidratado, con adecuada coloración de tegumentos. Orofaringe hiperémica con hipertrofia amigdalina bilateral y exudado blanquecino en ambas amígdalas. Adenopatías cervicales anteriores dolorosas a la palpación. Ausencia de tos. Campos pulmonares bien ventilados, sin agregados. Ruidos cardiacos rítmicos, sin soplos. Abdomen blando, depresible, no doloroso.',
      signosVitales: { ta: '118/76', fc: '92', fr: '18', temp: '38.4', sato2: '98', peso: '72', talla: '1.70' },
      diagnosticos: [
        { cie10: 'J03.9', texto: 'Amigdalitis aguda, no especificada' },
        { cie10: 'R50.9', texto: 'Fiebre, no especificada' },
      ],
      plan: [
        'Criterios de Centor 4/4 (exudado amigdalino, adenopatía cervical dolorosa, fiebre >38 °C, ausencia de tos): se decide manejo antibiótico empírico.',
        'Antibioticoterapia con amoxicilina por 7 días.',
        'Manejo sintomático con analgésico-antipirético.',
        'Cita de control en 7 días para valorar respuesta clínica.',
        'No se solicitan estudios de laboratorio en este momento por cuadro clínico característico.',
      ],
      indicaciones: [
        'Tomar el antibiótico completo aunque se sienta mejor antes de terminarlo.',
        'Abundantes líquidos: al menos 2 litros de agua al día.',
        'Gárgaras con agua tibia con sal 3 veces al día.',
        'Dieta blanda y fría según tolerancia.',
        'Reposo relativo durante 48 horas.',
        'Acudir a urgencias si presenta dificultad respiratoria, incapacidad para tragar líquidos, salivación excesiva o fiebre que no cede en 48 horas.',
      ],
      receta: [
        { farmaco: 'Amoxicilina 500 mg', dosis: '1 cápsula', via: 'Oral', frecuencia: 'Cada 8 horas', duracion: '7 días' },
        { farmaco: 'Paracetamol 500 mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 8 horas por razón necesaria', duracion: '3 días' },
      ],
      pronostico: 'Bueno para la vida y la función con apego al tratamiento indicado.',
    },
  },

  {
    id: 'hipertension',
    motivo: 'Control de hipertensión arterial',
    claves: ['presion', 'presión', 'hipertension', 'hipertensión', 'control', 'losartan', 'losartán'],
    transcript: [
      { t: 2,  hablante: 'medico',   texto: 'Buenos días, viene a su control de presión. ¿Cómo se ha sentido?' },
      { t: 8,  hablante: 'paciente', texto: 'Bien en general, doctor. A veces me duele un poco la cabeza en las tardes.' },
      { t: 16, hablante: 'medico',   texto: '¿Ha estado tomando el losartán todos los días?' },
      { t: 21, hablante: 'paciente', texto: 'Sí, el de 50 en la mañana. A veces se me olvida los fines de semana.' },
      { t: 29, hablante: 'medico',   texto: '¿Se ha estado midiendo la presión en casa?' },
      { t: 33, hablante: 'paciente', texto: 'Sí, la traigo anotada. Anda entre 140 y 150 la de arriba.' },
      { t: 41, hablante: 'medico',   texto: '¿Ha bajado la sal? ¿Está haciendo ejercicio?' },
      { t: 46, hablante: 'paciente', texto: 'La sal sí le bajé. Camino poquito, como dos veces por semana.' },
      { t: 54, hablante: 'medico',   texto: 'Vamos a medirla. Presión 148 sobre 92, pulso 78, peso 88 kilos, talla 1.72.' },
      { t: 66, hablante: 'medico',   texto: 'No tiene edema en piernas, el corazón se escucha rítmico, sin soplos.' },
      { t: 74, hablante: 'medico',   texto: 'La presión sigue arriba de meta. Vamos a subir el losartán a 100 miligramos al día.' },
      { t: 84, hablante: 'medico',   texto: 'Le voy a pedir química sanguínea, perfil de lípidos, electrolitos, creatinina y examen general de orina.' },
      { t: 95, hablante: 'medico',   texto: 'Necesito que camine 30 minutos, cinco días a la semana, y que siga midiendo la presión en casa dos veces al día.' },
      { t: 108, hablante: 'paciente', texto: 'De acuerdo doctor.' },
      { t: 112, hablante: 'medico',  texto: 'Lo veo en un mes con los resultados.' },
    ],
    note: {
      motivo: 'Consulta de control de hipertensión arterial sistémica',
      padecimientoActual:
        'Paciente masculino con diagnóstico previo de hipertensión arterial sistémica en tratamiento con losartán 50 mg cada 24 horas. Refiere apego irregular al tratamiento, con omisión de dosis los fines de semana. Presenta cefalea vespertina ocasional. Automonitoreo domiciliario con cifras sistólicas entre 140 y 150 mmHg. Refiere reducción del consumo de sal y actividad física de 2 sesiones semanales. Niega disnea, dolor precordial, palpitaciones, edema o alteraciones visuales.',
      exploracionFisica:
        'Paciente en buenas condiciones generales, consciente y orientado. Cuello sin ingurgitación yugular ni soplos carotídeos. Ruidos cardiacos rítmicos, de buena intensidad, sin soplos ni agregados. Campos pulmonares bien ventilados. Abdomen blando, sin visceromegalias. Extremidades sin edema, con pulsos periféricos presentes y simétricos.',
      signosVitales: { ta: '148/92', fc: '78', fr: '17', temp: '36.5', sato2: '97', peso: '88', talla: '1.72' },
      diagnosticos: [
        { cie10: 'I10', texto: 'Hipertensión esencial (primaria)' },
        { cie10: 'E66.9', texto: 'Obesidad, no especificada' },
        { cie10: 'Z91.1', texto: 'Incumplimiento del régimen terapéutico' },
      ],
      plan: [
        'Cifras tensionales fuera de meta (<140/90 mmHg): se ajusta tratamiento antihipertensivo aumentando losartán a 100 mg cada 24 horas.',
        'Se solicita química sanguínea, perfil de lípidos, electrolitos séricos, creatinina con TFG estimada y examen general de orina.',
        'Refuerzo de adherencia terapéutica y modificación del estilo de vida.',
        'IMC 29.7 kg/m²: se indica reducción ponderal como meta a mediano plazo.',
        'Cita de control en 4 semanas con resultados de laboratorio.',
      ],
      indicaciones: [
        'Tomar losartán 100 mg todos los días a la misma hora, sin omitir fines de semana.',
        'Medir y registrar la presión arterial dos veces al día, en reposo.',
        'Caminata de 30 minutos, 5 días por semana.',
        'Dieta hiposódica: menos de 5 gramos de sal al día; evitar embutidos y alimentos procesados.',
        'Acudir a urgencias si presenta dolor de pecho, dificultad para respirar, visión borrosa o cifras mayores a 180/110 mmHg.',
      ],
      receta: [
        { farmaco: 'Losartán 100 mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 24 horas', duracion: 'Permanente' },
      ],
      pronostico: 'Bueno para la vida, reservado para la función a largo plazo si no se logra control tensional adecuado.',
    },
  },

  {
    id: 'lumbalgia',
    motivo: 'Dolor lumbar',
    claves: ['espalda', 'lumbar', 'cintura', 'lumbalgia', 'cargar'],
    transcript: [
      { t: 3,  hablante: 'medico',   texto: 'Cuénteme, ¿qué le pasó?' },
      { t: 7,  hablante: 'paciente', texto: 'Hace cinco días cargué unas cajas en el trabajo y desde entonces me duele mucho la cintura.' },
      { t: 17, hablante: 'medico',   texto: '¿El dolor le baja a la pierna?' },
      { t: 21, hablante: 'paciente', texto: 'No, se queda en la espalda baja. Me duele más cuando me agacho o me levanto de la silla.' },
      { t: 31, hablante: 'medico',   texto: '¿Ha tenido hormigueo, adormecimiento o debilidad en las piernas?' },
      { t: 37, hablante: 'paciente', texto: 'No, nada de eso.' },
      { t: 41, hablante: 'medico',   texto: '¿Problemas para orinar o para controlar el esfínter?' },
      { t: 46, hablante: 'paciente', texto: 'No doctor.' },
      { t: 50, hablante: 'medico',   texto: '¿Fiebre, pérdida de peso, algún antecedente de cáncer?' },
      { t: 55, hablante: 'paciente', texto: 'No, nada.' },
      { t: 60, hablante: 'medico',   texto: 'Recuéstese boca arriba. Le voy a levantar la pierna. ¿Le duele? Bien, negativo bilateral.' },
      { t: 72, hablante: 'medico',   texto: 'Hay contractura de la musculatura paravertebral lumbar, dolorosa a la palpación. Fuerza y reflejos normales.' },
      { t: 84, hablante: 'medico',   texto: 'Es una lumbalgia mecánica, sin datos de alarma. No necesita radiografías por ahora.' },
      { t: 94, hablante: 'medico',   texto: 'Le doy naproxeno 250 miligramos cada 12 horas por 5 días, con alimento, y metocarbamol por la noche.' },
      { t: 106, hablante: 'medico',  texto: 'Importante: no guarde reposo absoluto, mantenga actividad ligera. Calor local 20 minutos dos veces al día.' },
      { t: 118, hablante: 'medico',  texto: 'Si le empieza a bajar el dolor a la pierna, si siente debilidad o pierde control de esfínteres, venga de inmediato.' },
    ],
    note: {
      motivo: 'Dolor lumbar de 5 días de evolución posterior a esfuerzo físico',
      padecimientoActual:
        'Paciente refiere dolor en región lumbar de 5 días de evolución, de inicio posterior a levantamiento de carga pesada en el ámbito laboral. El dolor es de características mecánicas, se exacerba con la flexión del tronco y la bipedestación desde sedestación, y mejora con el reposo. Niega irradiación a extremidades inferiores, parestesias, déficit de fuerza y alteraciones esfinterianas. Niega fiebre, pérdida ponderal y antecedente oncológico.',
      exploracionFisica:
        'Marcha antiálgica. Columna lumbar con rectificación de la lordosis fisiológica y contractura de musculatura paravertebral bilateral, dolorosa a la palpación profunda. Movilidad lumbar limitada por dolor a la flexión. Maniobra de Lasègue negativa bilateral. Fuerza muscular 5/5 en ambas extremidades inferiores. Reflejos osteotendinosos normales y simétricos. Sensibilidad conservada.',
      signosVitales: { ta: '124/78', fc: '74', fr: '16', temp: '36.4', sato2: '98', peso: '81', talla: '1.75' },
      diagnosticos: [{ cie10: 'M54.5', texto: 'Lumbago no especificado' }],
      plan: [
        'Lumbalgia mecánica aguda sin banderas rojas: no se justifican estudios de imagen en este momento.',
        'Manejo con AINE y relajante muscular por 5 días.',
        'Mantener actividad física ligera; se contraindica el reposo absoluto en cama.',
        'Reevaluación en 7 días o antes si aparecen datos de alarma neurológicos.',
      ],
      indicaciones: [
        'Tomar el naproxeno siempre con alimento para proteger el estómago.',
        'Aplicar calor local en la zona lumbar 20 minutos, dos veces al día.',
        'Evitar cargar objetos de más de 5 kg durante 2 semanas.',
        'Continuar con actividad cotidiana ligera y caminata; no permanecer en cama.',
        'Acudir de inmediato si el dolor se irradia a la pierna, aparece debilidad, adormecimiento o pérdida del control de esfínteres.',
      ],
      receta: [
        { farmaco: 'Naproxeno 250 mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 12 horas con alimento', duracion: '5 días' },
        { farmaco: 'Metocarbamol 750 mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 24 horas por la noche', duracion: '5 días' },
      ],
      pronostico: 'Bueno para la vida y la función; resolución esperada en 2 a 4 semanas.',
    },
  },

  {
    id: 'control-diabetes',
    motivo: 'Control de diabetes mellitus tipo 2',
    claves: ['azucar', 'azúcar', 'diabetes', 'glucosa', 'metformina'],
    transcript: [
      { t: 3,  hablante: 'medico',   texto: 'Buenos días, ¿cómo ha estado con sus niveles de azúcar?' },
      { t: 9,  hablante: 'paciente', texto: 'Más o menos, doctor. En ayunas me sale entre 140 y 160.' },
      { t: 18, hablante: 'medico',   texto: '¿Sigue con la metformina de 850 dos veces al día?' },
      { t: 24, hablante: 'paciente', texto: 'Sí, pero a veces me cae mal del estómago.' },
      { t: 31, hablante: 'medico',   texto: '¿La toma con la comida?' },
      { t: 34, hablante: 'paciente', texto: 'A veces en ayunas, la verdad.' },
      { t: 40, hablante: 'medico',   texto: '¿Ha notado hormigueo en los pies, visión borrosa o heridas que tarden en sanar?' },
      { t: 48, hablante: 'paciente', texto: 'A veces siento los pies dormidos en la noche.' },
      { t: 55, hablante: 'medico',   texto: 'Vamos a revisarle los pies. Piel íntegra, sin lesiones, pulsos presentes. La sensibilidad con el monofilamento está disminuida en ambos pies.' },
      { t: 70, hablante: 'medico',   texto: 'Presión 132 sobre 84, peso 94 kilos, glucosa capilar de hoy 158.' },
      { t: 80, hablante: 'medico',   texto: 'Le voy a pedir hemoglobina glucosilada, perfil de lípidos, creatinina y microalbuminuria en orina.' },
      { t: 92, hablante: 'medico',   texto: 'Mantenemos la metformina pero siempre con alimento, y le agrego revisión con oftalmología este año.' },
      { t: 104, hablante: 'medico',  texto: 'Revise sus pies todos los días y use calzado cerrado y cómodo. Nos vemos en un mes.' },
    ],
    note: {
      motivo: 'Consulta de control de diabetes mellitus tipo 2',
      padecimientoActual:
        'Paciente con diagnóstico previo de diabetes mellitus tipo 2 en tratamiento con metformina 850 mg cada 12 horas. Refiere automonitoreo con glucemias en ayuno entre 140 y 160 mg/dL. Reporta intolerancia gastrointestinal ocasional asociada a la toma del medicamento en ayuno. Refiere parestesias nocturnas en ambos pies. Niega alteraciones visuales, poliuria, polidipsia y lesiones cutáneas de difícil cicatrización.',
      exploracionFisica:
        'Paciente en buenas condiciones generales. Ruidos cardiacos rítmicos, sin soplos. Campos pulmonares bien ventilados. Abdomen globoso a expensas de panículo adiposo, blando, no doloroso. Exploración de pies: piel íntegra sin lesiones ni úlceras, sin datos de infección micótica, pulsos pedios y tibiales posteriores presentes y simétricos, llenado capilar menor a 2 segundos. Sensibilidad protectora disminuida a la prueba con monofilamento de 10 g en ambos pies.',
      signosVitales: { ta: '132/84', fc: '80', fr: '17', temp: '36.6', sato2: '97', peso: '94', talla: '1.68' },
      diagnosticos: [
        { cie10: 'E11.9', texto: 'Diabetes mellitus tipo 2 sin complicaciones, descontrolada' },
        { cie10: 'E11.4', texto: 'Diabetes mellitus tipo 2 con complicaciones neurológicas (polineuropatía en estudio)' },
      ],
      plan: [
        'Descontrol glucémico: se solicita hemoglobina glucosilada A1c para reestratificar el tratamiento.',
        'Se solicita perfil de lípidos, creatinina sérica con TFG estimada y relación albúmina/creatinina en orina.',
        'Se mantiene metformina 850 mg cada 12 horas con indicación explícita de tomarla con alimento para reducir la intolerancia gastrointestinal.',
        'Sensibilidad protectora disminuida: se establece pie de alto riesgo; educación en cuidado de pies y revisión en cada consulta.',
        'Envío a valoración por oftalmología para escrutinio de retinopatía diabética.',
        'Cita de control en 4 semanas con resultados.',
      ],
      indicaciones: [
        'Tomar la metformina siempre junto con los alimentos, nunca en ayuno.',
        'Revisar los pies todos los días, incluyendo entre los dedos y la planta.',
        'Usar calzado cerrado, cómodo y calcetines sin costuras; no caminar descalzo.',
        'Registrar la glucosa capilar en ayuno diariamente y llevar la libreta a la próxima cita.',
        'Actividad física de 150 minutos por semana distribuidos en al menos 5 días.',
        'Acudir a consulta si presenta heridas en los pies, glucosa mayor a 300 mg/dL o síntomas de hipoglucemia.',
      ],
      receta: [
        { farmaco: 'Metformina 850 mg', dosis: '1 tableta', via: 'Oral', frecuencia: 'Cada 12 horas con alimento', duracion: 'Permanente' },
      ],
      pronostico: 'Reservado para la función; dependiente del control metabólico sostenido y la adherencia terapéutica.',
    },
  },
]

export function pickCase(motivo: string): CaseScript {
  const m = motivo.toLowerCase()
  const hit = CASES.find((c) => c.claves.some((k) => m.includes(k)))
  return hit ?? CASES[0]!
}
