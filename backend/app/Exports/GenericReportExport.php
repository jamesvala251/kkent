<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;

class GenericReportExport implements FromArray, WithHeadings, WithTitle
{
    public function __construct(
        private array $headings,
        private array $rows,
        private string $title = 'Report'
    ) {}

    public function headings(): array
    {
        return $this->headings;
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function title(): string
    {
        return substr($this->title, 0, 31);
    }
}
