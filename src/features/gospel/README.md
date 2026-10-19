# gospel · Evangelio del día

Plan de lectura de los cuatro evangelios, un capítulo al día y en orden (Mateo 1 → Juan 21, 89 capítulos); al terminar vuelve a empezar. Si un día no se lee, al siguiente sigue el mismo capítulo: no se salta nada.

- Texto: Reina-Valera 1909 (dominio público, [eBible.org](https://ebible.org/details.php?id=spaRV1909)), incluido en `data/gospels.json` y cargado bajo demanda para no engordar el arranque. Se generó desde el archivo VPL de eBible conservando la ortografía original («á», «é»).
- Cada capítulo marcado como leído es una fila de `gospel_reading` (migración `0002_gratitude_gospel.sql`) con el día en que se leyó. Desmarcar borra la fila.
- Pantalla `/gospel`: capítulo de hoy con su texto, casilla «Lo leí», racha y lecturas recientes.
- Tarjeta en Hoy: capítulo del día, primer versículo y la misma casilla.
