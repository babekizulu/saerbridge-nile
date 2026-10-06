import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { ArchiveProvider } from '../hooks/useArchive'
import { FindingsPage } from '../pages/Explore'
import { ThemeBarChart } from '../components/Charts'
import { ArchiveContent } from '../components/Feedback'
import { archiveFixture } from '../data/fixtures'
import * as service from '../services/archive'

describe('archive interactions', () => {
  it('combines text and area filters, reports empty results, and resets', async () => {
    const call = vi.spyOn(service, 'getArchive').mockResolvedValue(archiveFixture)
    render(
      <MemoryRouter>
        <ArchiveProvider>
          <FindingsPage />
        </ArchiveProvider>
      </MemoryRouter>,
    )
    await screen.findByText('12 findings · fictional demonstration evidence')
    fireEvent.change(screen.getByLabelText('Search findings'), { target: { value: 'transport' } })
    expect(screen.getByText('2 findings · fictional demonstration evidence')).toBeVisible()
    fireEvent.change(screen.getAllByLabelText('Area')[0], { target: { value: 'greenbushes' } })
    expect(screen.getByText('1 findings · fictional demonstration evidence')).toBeVisible()
    fireEvent.change(screen.getByLabelText('Search findings'), {
      target: { value: 'no-such-evidence' },
    })
    expect(screen.getByText('No evidence matches these filters.')).toBeVisible()
    fireEvent.click(screen.getByRole('button', { name: 'Clear all filters' }))
    expect(screen.getByText('12 findings · fictional demonstration evidence')).toBeVisible()
    call.mockRestore()
  })
  it('offers a text table with the same interview interpretation', () => {
    render(
      <MemoryRouter>
        <ThemeBarChart findings={archiveFixture.findings.slice(0, 5)} />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Data table' }))
    expect(screen.getByRole('table')).toBeVisible()
    expect(screen.getAllByText('15 of 30 interviews (50%)').length).toBeGreaterThan(0)
  })
  it('shows a loading state and can recover from a service failure', async () => {
    const call = vi
      .spyOn(service, 'getArchive')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(archiveFixture)
    render(
      <ArchiveProvider>
        <ArchiveContent>{(a) => <p>{a.areas.length} areas loaded</p>}</ArchiveContent>
      </ArchiveProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('Loading')
    await screen.findByText('The archive could not be loaded.')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(screen.getByText('2 areas loaded')).toBeVisible())
    call.mockRestore()
  })
})
