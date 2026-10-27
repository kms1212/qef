import type { Run } from '../../types'

/** 실행 폴더 기준 경로 패턴. 이름 부분의 *는 아무 글자다. min개 이상이 이 단계에서 쓰였어야 한다. */
export type Required = { pattern: string; min: number }

const one = (pattern: string): Required => ({ pattern, min: 1 })

const DESIGN_FILES = ['overview', 'components', 'decisions', 'file-tree', 'requirement-proposals', 'refactor-candidates']

/** 단계를 제출할 때 실행 폴더에 있어야 하는 파일. 스킬의 단계 지시가 만들라고 한 것만 적는다. */
export function requiredFiles(run: Run, stage: string): Required[] {
  const reports = (name: string, min = 1): Required => ({ pattern: `reports/${stage}-${name}.json`, min })
  switch (stage) {
    case 'requirements':
      return [one('run.md'), one('requirements.json')]
    case 'design':
      return [
        ...DESIGN_FILES.map((f) => one(`design/${f}.json`)),
        one('issues.json'),
        one('reuse.json'),
        one('reports/design-research-codebase.json'),
        one('reports/design-research-prior-art.json'),
        { pattern: 'reports/design-review-*.json', min: 5 },
        ...(run.mode === 'refactor'
          ? [one('design/boundaries.json'), one('reports/design-research-boundaries.json')]
          : []),
      ]
    case 'common-tests':
    case 'rest-tests':
    case 'common-impl':
    case 'rest-impl':
    case 'common-fix':
    case 'full-fix':
      return [reports('*')]
    case 'common-review':
      return [reports('structure-compare'), reports('lens-*', 2), one('issues.json')]
    case 'full-review':
      return [reports('structure-compare'), reports('lens-*', 3), one('issues.json')]
    case 'common-verify':
    case 'rest-verify':
      return [reports('run-*')]
    case 'integration':
      return [one('reports/integration-write*.json'), one('reports/integration-run-*.json')]
    case 'test-revision':
      return [one('reports/test-revision-*.json')]
    default:
      return []
  }
}
