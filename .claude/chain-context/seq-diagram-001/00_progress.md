# Task: Sequence Diagram from Activity Diagram
**ID:** seq-diagram-001
**Status:** IN_PROGRESS

## Inputs received
- [x] Activity diagram image (3 actors: Manajer, Sistem, Teknisi)
- [x] draw.io format example (UserObject + plantUmlData JSON + embedded SVG)

## Activity Diagram Flow
1. Inisiasi Proyek: Manajer buat proyek → Sistem rekomendasikan teknisi → Alokasi + buat tasks → Notifikasi ke Teknisi
2. Pelaporan Harian: Teknisi buka Kanban → geser status Working On It + upload foto → Notifikasi ke Manajer
3. Review Gate: Manajer buka detail tugas + tinjau foto → [Y] Approve → Done → Hitung SPI → Notifikasi keduanya | [N] Kirim revisi → Forward ke Teknisi

## draw.io Format
- UserObject with plantUmlData={"data":"@startuml...@enduml","format":"svg"}
- mxCell with style=shape=image + embedded SVG base64
- PlantUML style: strictuml, maxMessageSize 150
- Actors: actor symbol for M/T, participant rectangle for S
- Sections: == dividers ==
- Activation bars on Sistem
- Alt/else blocks for validation

## Tasks
- [x] Receive inputs
- [ ] Naomi: Explore backend routes for API endpoint names
- [ ] Synthesize PlantUML with API context
- [x] Generate draw.io XML file
- [ ] Deliver to user
