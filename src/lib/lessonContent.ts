export interface LessonText {
  id: string;
  title: string;
  body: string;
  wordCount: number;
  level: 'B1' | 'B2' | 'C1';
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number; // index of correct option
}

// ── Textos en español de distintos niveles ──────────────────────────────────

export const TEXTS: LessonText[] = [
  {
    id: 'diagnostic-01',
    title: 'La Arquitectura del Cerebro Lector',
    level: 'B2',
    wordCount: 250,
    body: `Cuando leemos, nuestro cerebro activa simultáneamente varias regiones especializadas. La corteza visual procesa las formas de las letras, mientras que el área de Broca y el giro angular convierten esos símbolos en sonidos y significados. Este proceso, que parece instantáneo, involucra millones de conexiones neuronales que se fortalecen con la práctica constante.

Los estudios de seguimiento ocular han revelado que los ojos no se deslizan suavemente sobre el texto. En cambio, realizan pequeños saltos llamados sacadas, deteniéndose brevemente en puntos de fijación. Durante cada pausa, el ojo capta entre siete y nueve letras con nitidez. Los lectores expertos logran capturar más información en cada fijación, reduciendo el número total de pausas necesarias por línea.

La subvocalización, ese hábito de pronunciar mentalmente las palabras mientras leemos, es una herencia de nuestra infancia cuando aprendíamos a leer en voz alta. Aunque muchos la consideran un obstáculo, la ciencia demuestra que una reducción selectiva, no total, es la estrategia correcta. Las palabras complejas y desconocidas se procesan mejor con apoyo fonológico interno.

La buena noticia es que el cerebro adulto conserva su plasticidad. Con entrenamiento sistemático de apenas quince minutos diarios durante ocho semanas, los investigadores han documentado mejoras sostenidas en la velocidad y retención de lectura. La clave está en la práctica deliberada y la medición constante del progreso.`,
    questions: [
      {
        question: '¿Cómo se llaman los pequeños saltos que realizan los ojos durante la lectura?',
        options: ['Fijaciones', 'Sacadas', 'Regresiones', 'Saccadas'],
        correct: 1,
      },
      {
        question: '¿Cuántas letras capta el ojo con nitidez en cada fijación?',
        options: ['Entre 3 y 5', 'Entre 7 y 9', 'Entre 12 y 15', 'Entre 20 y 25'],
        correct: 1,
      },
      {
        question: '¿Cuál es la estrategia correcta respecto a la subvocalización?',
        options: ['Eliminarla completamente', 'Aumentarla', 'Reducirla selectivamente', 'Ignorarla'],
        correct: 2,
      },
      {
        question: '¿Cuánto tiempo de práctica diaria mencionan los investigadores?',
        options: ['5 minutos', '30 minutos', '15 minutos', '1 hora'],
        correct: 2,
      },
      {
        question: '¿Qué región cerebral convierte los símbolos en significados?',
        options: ['El cerebelo', 'El área de Broca y el giro angular', 'La amígdala', 'El hipocampo'],
        correct: 1,
      },
    ],
  },
  {
    id: 'pacing-01',
    title: 'El Poder de la Concentración Profunda',
    level: 'B2',
    wordCount: 200,
    body: `La concentración profunda, lo que el psicólogo Mihaly Csikszentmihalyi llamó estado de flujo, es la capacidad de sumergirse completamente en una tarea durante un período prolongado. En este estado, el tiempo parece detenerse, la autocrítica desaparece y el rendimiento alcanza su máximo potencial.

Los neurocientíficos han descubierto que el estado de flujo activa el cortex prefrontal lateral, responsable del pensamiento crítico, mientras simultáneamente silencia la red neuronal por defecto, asociada con la divagación mental. Esta combinación explica por qué las personas en estado de flujo producen trabajo de mayor calidad en menos tiempo.

Para los lectores, alcanzar el flujo requiere eliminar interrupciones externas y establecer un ritmo de lectura consistente. Un marcador visual que guíe la mirada a velocidad constante puede inducir este estado de manera natural. El ojo sigue el movimiento sin esfuerzo consciente, y la mente se libera para procesar el significado en lugar de controlar el movimiento ocular.

Las investigaciones sobre técnicas de lectura muestran que los lectores que utilizan un guía visual reducen sus regresiones en hasta un veinticinco por ciento y mantienen niveles más altos de comprensión durante períodos prolongados.`,
    questions: [
      {
        question: '¿Quién definió el concepto de estado de flujo?',
        options: ['Carl Jung', 'Mihaly Csikszentmihalyi', 'William James', 'B.F. Skinner'],
        correct: 1,
      },
      {
        question: '¿Qué red neuronal se silencia durante el estado de flujo?',
        options: ['La red sensorial', 'La red motora', 'La red neuronal por defecto', 'La red auditiva'],
        correct: 2,
      },
      {
        question: '¿En cuánto reducen las regresiones los lectores que usan guía visual?',
        options: ['10%', '25%', '50%', '75%'],
        correct: 1,
      },
      {
        question: '¿Qué caracteriza al estado de flujo respecto al tiempo?',
        options: ['El tiempo parece acelerarse', 'El tiempo parece detenerse', 'Se pierde la noción del tiempo futuro', 'El tiempo se vuelve irrelevante'],
        correct: 1,
      },
      {
        question: '¿Qué región cerebral se activa en el estado de flujo?',
        options: ['El cerebelo', 'El cortex prefrontal lateral', 'El tálamo', 'El hipocampo'],
        correct: 1,
      },
    ],
  },
  {
    id: 'rsvp-01',
    title: 'La Memoria como Sistema Activo',
    level: 'B2',
    wordCount: 180,
    body: `Durante décadas, la psicología concibió la memoria como un archivo estático, similar a un disco duro. Hoy sabemos que es todo lo contrario: un sistema dinámico y reconstructivo que reescribe activamente cada recuerdo cada vez que lo evoca.

Este proceso, llamado reconsolidación, tiene implicaciones profundas para el aprendizaje. Cada vez que recordamos algo, ese recuerdo se vuelve temporalmente vulnerable y susceptible de modificarse. Los investigadores han aprovechado esta ventana de plasticidad para diseñar técnicas de estudio que aprovechan la reconsolidación.

La repetición espaciada, desarrollada a partir de la curva del olvido de Ebbinghaus en 1885, es hoy el método más respaldado por la neurociencia para la retención a largo plazo. En lugar de estudiar masivamente antes de un examen, la información se repasa en intervalos que aumentan progresivamente: un día, tres días, siete días, veintiún días. Cada repaso refuerza la traza neuronal en el momento óptimo, justo antes de que el cerebro la olvide.

La combinación de lectura veloz con repetición espaciada es la estrategia más eficiente para transformar información en conocimiento duradero.`,
    questions: [
      {
        question: '¿Cómo describe el texto la memoria?',
        options: ['Como un archivo estático', 'Como un sistema dinámico y reconstructivo', 'Como una base de datos', 'Como una grabadora'],
        correct: 1,
      },
      {
        question: '¿Quién desarrolló la curva del olvido?',
        options: ['Freud', 'Pavlov', 'Ebbinghaus', 'Skinner'],
        correct: 2,
      },
      {
        question: '¿Cuál es el intervalo inicial en la repetición espaciada mencionado en el texto?',
        options: ['12 horas', '1 día', '3 días', '1 semana'],
        correct: 1,
      },
      {
        question: '¿Qué es la reconsolidación?',
        options: ['Una técnica de memorización', 'El proceso de reescribir recuerdos al evocarlos', 'Un tipo de amnesia', 'Una fase del sueño'],
        correct: 1,
      },
      {
        question: '¿Cuándo ocurre el repaso ideal según el texto?',
        options: ['Cuando el recuerdo está fresco', 'Justo antes de que el cerebro lo olvide', 'Después de haberlo olvidado completamente', 'Aleatoriamente'],
        correct: 1,
      },
    ],
  },
  {
    id: 'shield-01',
    title: 'La Neuroplasticidad en Acción',
    level: 'B1',
    wordCount: 160,
    body: `Durante mucho tiempo, los científicos creyeron que el cerebro adulto era fijo e inmutable. Esta idea cambió radicalmente cuando la investigadora Marian Diamond demostró en 1964 que los ratones criados en ambientes enriquecidos desarrollaban córtex cerebral más grueso y denso que los criados en ambientes simples.

Hoy sabemos que el cerebro humano adulto mantiene una capacidad notable de reorganizarse y crear nuevas conexiones neuronales. Esta propiedad, llamada neuroplasticidad, es la base científica de todo aprendizaje y entrenamiento cognitivo.

Para la lectura rápida, la neuroplasticidad significa que los patrones de movimiento ocular, la capacidad de atención y la velocidad de procesamiento visual pueden mejorarse con práctica deliberada. Los estudios con escáneres cerebrales muestran que los lectores entrenados presentan mayor actividad en el área V5, responsable del procesamiento del movimiento visual.

La práctica constante crea mielina adicional alrededor de las vías neuronales más utilizadas, lo que acelera la transmisión de señales y hace que las habilidades adquiridas se vuelvan automáticas y eficientes.`,
    questions: [
      {
        question: '¿Qué demostró Marian Diamond en 1964?',
        options: ['Que el cerebro no cambia', 'Que ambientes enriquecidos desarrollan más el córtex', 'Que los ratones aprenden mejor solos', 'Que la neuroplasticidad no existe'],
        correct: 1,
      },
      {
        question: '¿Qué es la neuroplasticidad?',
        options: ['Una enfermedad cerebral', 'La capacidad del cerebro de reorganizarse y crear nuevas conexiones', 'Un tipo de plasticidad muscular', 'La velocidad de procesamiento'],
        correct: 1,
      },
      {
        question: '¿Qué área cerebral es responsable del procesamiento del movimiento visual?',
        options: ['V1', 'V5', 'V10', 'El lóbulo temporal'],
        correct: 1,
      },
      {
        question: '¿Qué sustancia recubre las vías neuronales más utilizadas?',
        options: ['Glucosa', 'Mielina', 'Dopamina', 'Serotonina'],
        correct: 1,
      },
      {
        question: '¿Cuál es la base científica del entrenamiento cognitivo según el texto?',
        options: ['La genética', 'La neuroplasticidad', 'La inteligencia innata', 'La alimentación'],
        correct: 1,
      },
    ],
  },
  {
    id: 'sprint-01',
    title: 'Los Hábitos del Lector Veloz',
    level: 'B2',
    wordCount: 220,
    body: `Los grandes lectores de la historia compartían un rasgo curioso: no leían más rápido porque fueran más inteligentes, sino porque habían eliminado sistemáticamente los hábitos que ralentizan al lector promedio. Theodore Roosevelt leía un libro por día mientras ejercía la presidencia de los Estados Unidos. Su secreto no era un don sobrenatural sino una técnica disciplinada.

El primer hábito que separa al lector experto del novato es la eliminación de regresiones innecesarias. Los estudios de ojo-tracking muestran que el lector promedio regresa al quince por ciento del texto que ya leyó. La mayoría de estas regresiones no corrigen errores de comprensión reales; son simplemente un hábito nervioso que consume tiempo valioso.

El segundo hábito es la expansión del campo visual. Los lectores principiantes fijan su mirada en cada palabra individual. Los expertos entrenan su visión periférica para capturar grupos de tres a cinco palabras en una sola fijación, reduciendo así el número total de movimientos oculares necesarios.

El tercer hábito es la lectura por contexto. El cerebro de un lector experimentado predice constantemente las próximas palabras basándose en el contexto semántico y sintáctico. Esto permite que las palabras frecuentes sean procesadas con un esfuerzo mínimo, liberando recursos cognitivos para las palabras de mayor densidad conceptual.`,
    questions: [
      {
        question: '¿Cuántos libros leía Theodore Roosevelt por día?',
        options: ['Dos libros', 'Medio libro', 'Un libro', 'Tres libros'],
        correct: 2,
      },
      {
        question: '¿Qué porcentaje del texto regresa a releer el lector promedio?',
        options: ['5%', '10%', '15%', '25%'],
        correct: 2,
      },
      {
        question: '¿Cuántas palabras capturan por fijación los lectores expertos?',
        options: ['1-2 palabras', '3-5 palabras', '6-8 palabras', '10+ palabras'],
        correct: 1,
      },
      {
        question: '¿Qué es la lectura por contexto?',
        options: ['Leer solo el contexto del texto', 'Predecir las próximas palabras basándose en el contexto', 'Leer con una guía visual', 'Ignorar palabras desconocidas'],
        correct: 1,
      },
      {
        question: '¿Qué libera la lectura experta de palabras frecuentes?',
        options: ['Tiempo de lectura', 'Recursos cognitivos', 'Capacidad visual', 'Memoria a corto plazo'],
        correct: 1,
      },
    ],
  },
];

export function getTextById(id: string): LessonText | undefined {
  return TEXTS.find(t => t.id === id);
}

export function getTextForLesson(lessonId: string): LessonText {
  const map: Record<string, string> = {
    M1L1: 'diagnostic-01',
    M1L2: 'pacing-01',
    M1L3: 'shield-01',
    M1L5: 'rsvp-01',
    M2L2: 'rsvp-01',
    M3L1: 'sprint-01',
  };
  return TEXTS.find(t => t.id === (map[lessonId] ?? 'diagnostic-01')) ?? TEXTS[0];
}
