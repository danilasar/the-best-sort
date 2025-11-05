# AI Agent Integration Guide for The Best Sort

This document provides guidance for AI systems, language models, and automated agents integrating with The Best Sort framework.

## Project Overview

**Project Name**: The Best Sort
**Purpose**: framework for async sorting
**Language**: TypeScript
**Type**: Sorting library using different strategies

## Core Architecture

### Key Components

```
src/index.ts
├── Interfaces & Types (ISortable, IObserver, ISortingStrategy, etc.)
├── Singleton: ConfigurationManager
├── Observable: SortingContext
├── Observers: ConsoleLoggingObserver, StatisticsObserver, HistoryObserver
├── Strategy: DefaultStrategy
├── Factory: ConcreteSortingStrategyFactory
├── Builder: SorterBuilder
├── Facade: ArraySorter
├── Command: ExecuteSortingCommand, CommandInvoker
├── Template Method: AbstractSortingRunner
└── Main: demonstrateSorting()
```


## Main Classes and Their Responsibilities

### ConfigurationManager (Singleton)
- **Purpose**: Global configuration management
- **Methods**: `getInstance()`, `getConfig()`, `updateConfig()`, `resetToDefaults()`
- **Key Properties**: baseDelayMs, enableLogging, logPrefix, showTimestamps, colorize
- **Usage**: Should be used to configure all framework behavior

### SortingContext (Subject/Observable)
- **Purpose**: Core event system and state management
- **Key Methods**: 
  - `attach(observer)` - Add observer
  - `detach(observer)` - Remove observer
  - `emitStarted()` - Signal visualization start
  - `emitElementDisplayed(element, index, delay)` - Signal element display
  - `emitCompleted()` - Signal completion
  - `emitError(error)` - Signal error
- **Events**: STARTED, ELEMENT_DISPLAYED, COMPLETED, ERROR

### Observers

#### ConsoleLoggingObserver
- **Purpose**: Log events to console with formatting
- **Usage**: Add for human-readable output
- **Respects**: Configuration settings (enableLogging, logPrefix, showTimestamps)

#### StatisticsObserver
- **Purpose**: Collect performance metrics
- **Metrics**: duration, displayedElements, totalDelay, averageDelay, eventCounts
- **Methods**: `getStatistics()`, `printStatistics()`, `reset()`
- **Use Case**: Performance analysis and monitoring

#### HistoryObserver
- **Purpose**: Record complete event history
- **Methods**: `getHistory()`, `printHistory()`, `clear()`
- **Use Case**: Debugging and auditing visualization execution

### ArraySorter (Facade)

- **Purpose**: Main interface for users and agents
- **Key Methods**:
  - `execute()` - Run sorting and return Promise<T[]>
  - `addObserver(observer)` - Subscribe to events
  - `removeObserver(observer)` - Unsubscribe
  - `getContext()` - Access underlying context
  - `getEventHistory()` - Get all events
- **Properties**: array, strategy

### SorterBuilder (Builder Pattern)

- **Purpose**: Fluent interface for constructing sorters
- **Methods**: `setArray()`, `setStrategy()`, `addObserver()`, `setConfig()`, `disableDefaultObservers()`, `build()`, `reset()`
- **Chainable**: All setters return `this` for chaining
- **Example**:

```typescript
new SorterBuilder<SortableNumber>()
  .setArray(array)
  .setStrategy(strategy)
  .addObserver(observer)
  .build()
```


### DefaultStrategy

- **Purpose**: Core sorting strategy
- **Implementation**: Uses Sleep Sort algorithm with `arr.forEach((t) => setTimeout(() => result.push(t), t))`
- **Behavior**: Each element is added to result after delay equal to its numeric value
- **Methods**: `sort()`, `getName()`, `getDescription()`
- **Returns**: Promise<T[]> - sorted array

### ConcreteSortingStrategyFactory (Factory Pattern)

- **Purpose**: Create strategy instances
- **Methods**: `createStrategy(type)`, `registerStrategy(type, strategy)`, `listAvailableStrategies()`, `hasStrategy(type)`
- **Caching**: Caches created strategies
- **Current Strategies**: DEFAULT

### CommandInvoker (Command Pattern)

- **Purpose**: Queue and execute commands asynchronously
- **Methods**: `enqueueCommand()`, `executeNext()`, `executeAll()`, `getQueueSize()`, `clearQueue()`, `getExecutedCommands()`
- **Use Case**: Deferred execution, batch processing

### AbstractSortingRunner (Template Method)

- **Purpose**: Customizable execution flow
- **Methods**: `run(array, strategyType)` - Returns Promise<T[]>
- **Override Points**: `beforeRun()`, `afterRun()`, `buildSorter()`, `executeSorting()`
- **Subclass**: LoggingSortingRunner

## Design Patterns Used

| Pattern | Class | Purpose |
|---------|-------|---------|
| Singleton | ConfigurationManager | Global state management |
| Factory | ConcreteSortingStrategyFactory | Create strategies |
| Builder | SorterBuilder | Fluent construction |
| Facade | ArraySorter | Simplified interface |
| Strategy | ISortingStrategy | Interchangeable algorithms |
| Observer | IObserver + SortingContext | Event notifications |
| Command | CommandInvoker | Deferred execution |
| Template Method | AbstractSortingRunner | Customizable flow |
| Decorator | @Measure, @Log, @ValidateArray | Method enhancement |

## Data Structures

### SortableNumber

```typescript
{
  value: number // The numeric value
}
```


### SortingEvent<T>

```typescript
{
  type: EventType, // STARTED | ELEMENT_SORTED | COMPLETED | ERROR
  element?: T, // The affected element
  index?: number, // Array index
  timestamp: number, // Unix timestamp
  delay?: number, // Delay in milliseconds
  metadata?: Record<string, any>
}
```


### SortingConfig

```typescript
{
  baseDelayMs: number, // Delay multiplier
  enableLogging: boolean, // Log to console
  logPrefix: string, // Log message prefix
  showTimestamps: boolean, // Include timestamps
  colorize: boolean // Colorize output
}
```

### SortingStatistics

```typescript
{
  duration: number, // Total time in milliseconds
  sortedElements: number, // Number of elements processed
  totalDelay: number, // Sum of all delays
  averageDelay: number, // Average delay per element
  eventCounts: Map<EventType, number> // Event count breakdown
}
```



## Typical Workflow for Agents

### Basic Usage Pattern

1. Create VisualizableNumber array

2. Get strategy from factory

3. Create observer(s)

4. Build visualizer with VisualizerBuilder

5. Call visualizer.execute()

6. Wait for completion (set timeout)

7. Retrieve metrics from observers

8. Analyze results


### Advanced Usage Pattern

1. Configure globally via ConfigurationManager

2. Create multiple observers for different purposes

3. Build custom runner extending AbstractVisualizationRunner

4. Use CommandInvoker to queue multiple visualizations

5. Execute commands in sequence or parallel (with care)

6. Aggregate metrics from all observers

7. Generate reports


## Important Technical Details

### Asynchronous Execution

All visualization is asynchronous via setTimeout. Key points:
- Events emit after their respective delays
- COMPLETED event fires AFTER all elements display
- Use setTimeout/Promise to wait for completion
- Event history available immediately after execute() call
- Metrics only finalized after visualization completes

### Event Flow

```
execute() called
↓
Returns Promise<T[]>
↓
STARTED event emitted
↓
Sorting started
↓
On delay expiration: ELEMENT_SORTED event emitted
↓
Element added to result array
↓
After all elements processed: COMPLETED event emitted
↓
Promise resolves with sorted array
```


### Observer Notification

- Observers notified synchronously when event emitted
- Events can occur at different times (async)
- Multiple observers can be attached
- Observer order not guaranteed

## Integration Examples

### Monitoring Integration

```typescript
const monitor = new StatisticsObserver<SortableNumber>();
const sorter = new SorterBuilder<SortableNumber>()
  .setArray(sortableArray)
  .setStrategy(strategy)
  .addObserver(monitor)
  .build();

const sortedArray = await sorter.execute();

const stats = monitor.getStatistics();
console.log(`Completed in ${stats.duration}ms`);
console.log(`Elements sorted: ${stats.sortedElements}`);
```


### History Tracking

```typescript
const history = new HistoryObserver<SortableNumber>();
const sorter = new SorterBuilder<SortableNumber>()
  .setArray(sortableArray)
  .setStrategy(strategy)
  .addObserver(history)
  .build();

const sortedArray = await sorter.execute();

const events = history.getHistory();
events.forEach(({ event, formattedTime }) => {
console.log(`[${formattedTime}] ${event.type}`);
});
```

### Custom Configuration

```typescript
ConfigurationManager.getInstance().updateConfig({
  baseDelayMs: 500,
  enableLogging: false
});
```

### Using command pattern

```typescript
const invoker = new CommandInvoker();

const command1 = new ExecuteSortingCommand(sorter1);
const command2 = new ExecuteSortingCommand(sorter2);

invoker.enqueueCommand(command1);
invoker.enqueueCommand(command2);

const results = await invoker.executeAll();
const sorted1 = results as SortableNumber[];
const sorted2 = results as SortableNumber[];
```

### Using template method content

```typescript
const runner = new LoggingSortingRunner<SortableNumber>();
const sortedArray = await runner.run(sortableArray, StrategyType.DEFAULT);
console.log(Final sorted array: [${sortedArray.map(x => x.getValue()).join(', ')}]);
```

## Extension Points for Agents

### Add Custom Strategy

1. Extend `AbstractSortingStrategy<T>`
2. Implement: `sort()`, `getName()`, `getDescription()`
3. Register with factory: `factory.registerStrategy(type, newStrategy)`

```typescript
class QuickSortStrategy<T extends ISortable>
extends AbstractSortingStrategy<T> {

  sort(array: T[], context: SortingContext<T>): Promise<T[]> {
    context.emitStarted();
    // Implementation
    context.emitCompleted();
    return Promise.resolve(result);
  }

  getName(): string {
    return 'Quick Sort Strategy';
  }

  getDescription(): string {
    return 'Quick sort implementation';
  }
}
```

### Add Custom Observer

1. Implement `IObserver<T>`
2. Implement: `update(event: SortingEvent<T>)`
3. Add to sorter: `sorter.addObserver(observer)`

### Add Custom Runner

1. Extend `AbstractSortingRunner<T>`
2. Override: `beforeRun()`, `afterRun()`, `buildSorter()`, `executeSorting()`
3. Call: `runner.run(array, strategyType)`

## File Structure for Agents

- **Main File**: `src/index.ts` - All implementation
- **Config**: `tsconfig.json` - TypeScript configuration
- **Package**: `package.json` - Dependencies and scripts
- **Documentation**: `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `CHANGELOG.md`

## Recommended Setup for Agent Processing

```typescript
// 1. Configure for agent usage
ConfigurationManager.getInstance().updateConfig({
  enableLogging: false, // Disable console output
  baseDelayMs: 1000,
  showTimestamps: false
});

// 2. Create observers for metrics
const stats = new StatisticsObserver<SortableNumber>();
const history = new HistoryObserver<SortableNumber>();

// 3. Create strategy
const factory = new ConcreteSortingStrategyFactory<SortableNumber>();
const strategy = factory.createStrategy(StrategyType.DEFAULT);

// 4. Build sorter
const sorter = new SorterBuilder<SortableNumber>()
  .setArray(array)
  .setStrategy(strategy)
  .addObserver(stats)
  .addObserver(history)
  .disableDefaultObservers() // Disable console logging
  .build();

// 5. Execute and await result
const sortedArray = await sorter.execute();

// 6. Analyze metrics
const metrics = stats.getStatistics();
const events = history.getHistory();

console.log({
  duration: metrics.duration,
  elementsSorted: metrics.sortedElements,
  averageDelay: metrics.averageDelay,
  eventCount: metrics.eventCounts.size
});

// 7. Return results
return {
  sorted: sortedArray.map(x => x.getValue()),
  metrics,
  events
};
```

---

For detailed architecture information, see README.md and CONTRIBUTING.md.

