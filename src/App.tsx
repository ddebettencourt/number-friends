import { GameContainer } from './components/Game/GameContainer'
import { StoryMode } from './components/Story/StoryMode'
import { useStoryStore } from './stores/storyStore'

function App() {
  const storyActive = useStoryStore((s) => s.active)
  return storyActive ? <StoryMode /> : <GameContainer />
}

export default App
