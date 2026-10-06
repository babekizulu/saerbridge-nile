import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ArchiveProvider } from './hooks/useArchive'
import { PublicLayout, RouteFocus } from './components/Layout'
import { ErrorBoundary, LoadingState, NotFound } from './components/Feedback'
import Home from './pages/Home'
const Areas = lazy(() => import('./pages/Explore').then((m) => ({ default: m.AreasPage })))
const Area = lazy(() => import('./pages/Explore').then((m) => ({ default: m.AreaPage })))
const Findings = lazy(() => import('./pages/Explore').then((m) => ({ default: m.FindingsPage })))
const Theme = lazy(() => import('./pages/Explore').then((m) => ({ default: m.ThemePage })))
const Datasets = lazy(() => import('./pages/Resources').then((m) => ({ default: m.DatasetsPage })))
const Developers = lazy(() =>
  import('./pages/Resources').then((m) => ({ default: m.DevelopersPage })),
)
const Methodology = lazy(() =>
  import('./pages/Resources').then((m) => ({ default: m.MethodologyPage })),
)
const About = lazy(() => import('./pages/Resources').then((m) => ({ default: m.AboutPage })))
const Research = lazy(() => import('./pages/Workspace'))
const Account = lazy(() => import('./pages/Account'))
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ArchiveProvider>
          <Suspense fallback={<LoadingState />}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route index element={<Home />} />
                <Route path="areas" element={<Areas />} />
                <Route path="areas/:slug" element={<Area />} />
                <Route path="findings" element={<Findings />} />
                <Route path="themes" element={<Findings />} />
                <Route path="themes/:slug" element={<Theme />} />
                <Route path="datasets" element={<Datasets />} />
                <Route path="developers" element={<Developers />} />
                <Route path="methodology" element={<Methodology />} />
                <Route path="about" element={<About />} />
                <Route path="account" element={<Account />} />
                <Route path="*" element={<NotFound />} />
              </Route>
              <Route path="research/*" element={<Research />} />
            </Routes>
            <RouteFocus />
          </Suspense>
        </ArchiveProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
