# The Best Sort

A comprehensive AI-friendly TypeScript library for array sorting and asynchronous processing using powerful strategy with advanced object-oriented programming patterns and design principles.

## Overview

The Best Sort is a production ready framework that demonstrates the application of multiple OOP design patterns, architectural principles, and advanced TypeScript features to visualize array element processing. The library implements a most powerful sort strategy.

## Installation

### Prerequisites

- Node.js 18.0.0 or higher
- npm or yarn

### Setup

Clone the repository and install dependencies:

```sh
npm install -D typescript @types/node
```

## Running the Library

```sh
npm install -D tsx
npx tsx src/index.ts
```

### Manual Compilation

```sh
npx tsc src/index.ts --experimentalDecorators --emitDecoratorMetadata
node the-best-sort.js
```

## Design Patterns

The Best Sort implements multiple design patterns to create a robust and extensible framework, including singleton, factory, builder, facade, decorators, strategy, observer, command invoker and runner.


## Core Components

### SortableNumber

A comparable number wrapper implementing the `SortableNumber` interface:

```typescript
const nums = [1, 2, 3].map(n => new SortableNumber(n));
```


### SortingContext

Manages state and event notifications during visualization:

```typescript
const context = new SortingContext<SortableNumber>("Strategy Name");
context.attach(observer);
context.emitElementDisplayed(element, index, delay);
```

## StrategyFactory

Create sorting strategies through the factory:

```typescript
const factory = new ConcreteSortingStrategyFactory<SortableNumber>();
const strategy = factory.createStrategy(StrategyType.DEFAULT);
```


### Observers

Track visualization events and collect metrics:

```typescript
const statsObserver = new StatisticsObserver<SortableNumber>();
const historyObserver = new HistoryObserver<SortableNumber>();
sorter.addObserver(statsObserver);
sorter.addObserver(historyObserver);
```


### Configuration Management

Control visualization behavior globally:

```typescript
ConfigurationManager.getInstance().updateConfig({
  baseDelayMs: 100,
  enableLogging: true,
  showTimestamps: true,
  colorize: true
});
```


## Event Types

The library emits the following event types during sorting:

- `STARTED` - Sorting has started
- `ELEMENT_SORTED` - An array element was processed and added to result
- `COMPLETED` - Sorting has completed
- `ERROR` - An error occurred during sorting

## Performance Metrics

`StatisticsObserver` collects the following metrics:

```typescript
interface SortingStatistics {
  duration: number; // Total duration in milliseconds
  sortedElements: number; // Number of elements sorted
  totalDelay: number; // Sum of all delays
  averageDelay: number; // Average delay per element
  eventCounts: Map<EventType, number>; // Event counts by type
}
```


## Architecture

The library follows a layered architecture:

1. **Core Domain** - `SortableNumber`, event types, configuration
2. **Patterns Layer** - Decorators, strategies, factory implementations
3. **Context Layer** - `SortingContext` managing state and notifications
4. **Observer Layer** - Multiple observer implementations (Console, Statistics, History)
5. **Application Layer** - `ArraySorter`, `CommandInvoker`, runners
6. **Factory Layer** - Strategy and builder creation

## TypeScript Features Used

- Generics for type-safe implementations
- Decorators for cross-cutting concerns
- Abstract classes and interfaces for contracts
- Union types and enums for type safety
- Method decorators with property descriptors
- Readonly types for immutability
- Object destructuring and spreading

## Usage

Basic usage:

```typescript
const numbers = [1, 100, 10];​
const sortableArray = numbers.map(n => new SortableNumber(n));

const factory = new ConcreteSortingStrategyFactory<SortableNumber>();
const strategy = factory.createStrategy(StrategyType.DEFAULT);

const sorter = new SorterBuilder<SortableNumber>()
  .setArray(sortableArray)
  .setStrategy(strategy)
  .build();

const sortedArray = await sorter.execute();
console.log(sortedArray)
```

### With custom observers

```typescript
const statisticsObserver = new StatisticsObserver<SortableNumber>();
const historyObserver = new HistoryObserver<SortableNumber>();

const sorter = new SorterBuilder<SortableNumber>()
.setArray(sortableArray)
.setStrategy(strategy)
.addObserver(statisticsObserver)
.addObserver(historyObserver)
.build();

await sorter.execute();
statisticsObserver.printStatistics();
historyObserver.printHistory();
```

### Using command pattern

```typescript
const invoker = new CommandInvoker();
const sortingCommand = new ExecuteSortingCommand(sorter);

invoker.enqueueCommand(sortingCommand);
const results = await invoker.executeAll();
```

### Using template method pattern

```typescript
const runner = new LoggingSortingRunner<SortableNumber>();
const sortedArray = await runner.run(sortableArray, StrategyType.DEFAULT);
```

## Extending the Library

### Creating Custom Observers

```typescript
class MetricsObserver<T extends ISortable> implements IObserver<T> {
  update(event: SortingEvent<T>): void {
    if (event.type === EventType.ELEMENT_SORTED) {
      // Custom logic here
    }
  }
}

sorter.addObserver(new MetricsObserver());
```

### Creating custom strategies

```typescript
class BubbleSortStrategy<T extends ISortable>
extends AbstractSortingStrategy<T> {

  sort(array: T[], context: SortingContext<T>): Promise<T[]> {
    context.emitStarted();
    // Implementation
    context.emitCompleted();
    return Promise.resolve(result);
  }

  getName(): string {
    return 'Bubble Sort Strategy';
  }

  getDescription(): string {
    return 'Classic bubble sort implementation';
  }
}

// Register strategy
factory.registerStrategy(StrategyType.BUBBLE, new BubbleSortStrategy());
```


### Creating Custom Commands

```typescript
class ResetCommand implements ICommand {
  async execute(): Promise<void> {
    ConfigurationManager.getInstance().resetToDefaults();
  }

  getDescription(): string {
    return 'Reset configuration to defaults';
  }
}

invoker.enqueueCommand(new ResetCommand());
```


### Creating Custom Runners

```typescript
class MetricsSortingRunner<T extends ISortable>
extends AbstractSortingRunner<T> {

  protected beforeRun(): void {
    console.log('Initializing sorting with metrics...');
  }

  protected afterRun(): void {
    console.log('Sorting completed with full metrics');
  }
}

const runner = new MetricsSortingRunner<SortableNumber>();
const result = await runner.run(sortableArray, StrategyType.DEFAULT);
```

## Requirements

- TypeScript 4.7 or higher
- Node.js 18.0.0 or higher
- Decorator support enabled in `tsconfig.json`

## Limitations

- Very large arrays (10,000+) may cause performance degradation

## Contributing

Contributions are welcome. Please ensure all code follows the established patterns and includes appropriate type annotations.

## Support

For issues, questions, or feature requests, please open an issue in the repository.
