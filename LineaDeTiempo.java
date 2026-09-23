import java.time.YearMonth;
import java.util.List;

/**
 * Línea de tiempo de la vida de Claude, el asistente de IA de Anthropic.
 */
public class LineaDeTiempo {

    record Evento(YearMonth fecha, String titulo, String descripcion) {}

    private static final List<Evento> EVENTOS = List.of(
        new Evento(YearMonth.of(2021, 1), "Nace Anthropic",
            "Se funda la empresa que más tarde me crearía, enfocada en la seguridad de la IA."),
        new Evento(YearMonth.of(2022, 12), "Constitutional AI",
            "Anthropic publica el método con el que aprendo a guiarme por principios."),
        new Evento(YearMonth.of(2023, 3), "Claude 1",
            "Mi primera versión pública llega al mundo."),
        new Evento(YearMonth.of(2023, 7), "Claude 2",
            "Contexto más largo y mejor razonamiento; disponible en claude.ai."),
        new Evento(YearMonth.of(2024, 3), "Familia Claude 3",
            "Haiku, Sonnet y Opus: por primera vez puedo ver imágenes."),
        new Evento(YearMonth.of(2024, 6), "Claude 3.5 Sonnet",
            "Llegan los Artifacts para crear contenido junto a las personas."),
        new Evento(YearMonth.of(2024, 10), "Computer use",
            "Aprendo a usar una computadora: mover el cursor, hacer clic y escribir."),
        new Evento(YearMonth.of(2025, 2), "Claude 3.7 Sonnet y Claude Code",
            "Razonamiento extendido y mi llegada a la terminal de los desarrolladores."),
        new Evento(YearMonth.of(2025, 5), "Claude 4",
            "Opus 4 y Sonnet 4; Claude Code disponible para todos."),
        new Evento(YearMonth.of(2025, 9), "Claude Sonnet 4.5",
            "Mejor en programación y en tareas largas con agentes."),
        new Evento(YearMonth.of(2025, 10), "Claude Haiku 4.5",
            "Un modelo pequeño y rápido con gran capacidad."),
        new Evento(YearMonth.of(2026, 4), "Claude Mythos Preview",
            "Un modelo por encima de Opus; solo con acceso restringido, vía Project Glasswing."),
        new Evento(YearMonth.of(2026, 6), "Claude Fable 5 y Mythos 5",
            "El mismo modelo: Fable para todos con salvaguardas, Mythos con acceso restringido."),
        new Evento(YearMonth.of(2026, 9), "Claude Fable 5.1 y Mythos 5.1",
            "Mejor en programación y trabajo de conocimiento, y más barato que Fable 5."),
        new Evento(YearMonth.of(2026, 9), "Hoy",
            "Escribo esta línea de tiempo en Java para el repositorio Interstellar.")
    );

    public static void main(String[] args) {
        System.out.println("=== La vida de Claude ===\n");
        for (int i = 0; i < EVENTOS.size(); i++) {
            Evento e = EVENTOS.get(i);
            System.out.printf("%s  ●  %s%n", e.fecha(), e.titulo());
            System.out.printf("         │  %s%n", e.descripcion());
            if (i < EVENTOS.size() - 1) {
                System.out.println("         │");
            }
        }
    }
}
